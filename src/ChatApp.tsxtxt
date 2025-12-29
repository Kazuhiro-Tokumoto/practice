import React, { useState, useEffect, useRef } from 'react';
import { generateKeyPair } from "./mojyu-ru/crypto/ecdh.js";
import { arrayBufferToBase64, base64ToUint8Array } from "./mojyu-ru/base64.js";
import { generateSalt, combineSalts } from "./mojyu-ru/crypto/saltaes.js";
import { handleDHMessage } from "./mojyu-ru/dh.js";
import { dhs } from "./mojyu-ru/joins.js";
import { deriveAesKeySafe } from "./mojyu-ru/crypto/kdf.js";
import { decrypt, encrypt } from "./mojyu-ru/crypto/aes.js";

// メッセージの型定義
type ChatMessage = {
  id: string;
  text: string;
  isMe: boolean;
  type: 'text' | 'system';
  senderName?: string;
};

const ChatApp: React.FC = () => {
  // --- State (画面の表示に関わる変数) ---
  const [isInRoom, setIsInRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("未接続");

  // --- Refs (再レンダリングせずに値を保持する変数) ---
  const wsRef = useRef<WebSocket | null>(null);
  const aesKeyRef = useRef<CryptoKey | null>(null);
  const myKeyRef = useRef<CryptoKeyPair | null>(null);
  const saltRef = useRef<Uint8Array | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null); // 自動スクロール用

  // ユーザー情報の取得
  const myDisplayName = localStorage.getItem("my_name") ?? "不明なユーザー";
  const storedToken = localStorage.getItem("my_token") ?? "";
  const storedUuid = localStorage.getItem("my_uuid") ?? "";

  // 初期化チェック
  useEffect(() => {
    if (storedToken === "") {
      window.location.href = "../index.html";
    }
    // コンポーネント全体のスタイル適用（bodyへの適用はReactではあまりやらないため、最上位divで行う）
  }, [storedToken]);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 退出処理（コンポーネントが消える時）
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave", room: roomName, name: myDisplayName }));
        wsRef.current.close();
      }
    };
  }, [roomName, myDisplayName]);

  // --- ロジック関数 ---

  const handleJoinRoom = async () => {
    if (!roomName) return;

    try {
      // 1. 暗号化の準備
      saltRef.current = generateSalt();
      const base64salt = await arrayBufferToBase64(saltRef.current);
      
      const keyPair = await generateKeyPair();
      myKeyRef.current = keyPair; // Refに保存
      const pubJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

      // 2. WebSocket接続開始
      const ws = new WebSocket("wss://mail.shudo-physics.com/");
      wsRef.current = ws; // Refに保存

      ws.onopen = () => {
        setStatus("接続中");
        ws.send(JSON.stringify({ 
          type: "join", 
          room: roomName, 
          name: myDisplayName, 
          uuid: storedUuid, 
          token: storedToken 
        }));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("受信メッセージ:", data);

        // --- システムメッセージ処理 ---
        if (data.type === "join-ack") {
            setIsInRoom(true);
            addMessage("参加しました", false, 'system');
        } 
        else if (data.type === "join-nack") {
            addMessage("エラー: ルームに参加できませんでした", false, 'system');
        }
        else if (["quit-broadcast", "leave", "leave-broadcast"].includes(data.type)) {
            const leaver = data.name ? data.name.substring(0, 8) : "誰か";
            addMessage(`${leaver}が退出しました`, false, 'system');
        }
        else if (data.type === "join-broadcast") {
            addMessage(`${data.name.substring(0, 8)}が参加しました`, false, 'system');
        }

        // --- 暗号化ハンドシェイク (DH) ---
        if ((data.type === "dh-start" || data.type === "join-broadcast") && data.name !== myDisplayName) {
            // dhs関数を使ってDHメッセージを作成
            const dhmsg = dhs(event, pubJwk, base64salt, myDisplayName, roomName);
            if (dhmsg) {
                ws.send(JSON.stringify(dhmsg));
                console.log("自分のDHを送信完了");
            }
        }
        else if (data.type === "DH" && data.name !== myDisplayName) {
            try {
                if (!myKeyRef.current || !saltRef.current) return;

                const remoteSalt = await base64ToUint8Array(data.salt);
                const saltAll = combineSalts(saltRef.current, remoteSalt);
                
                // ここで秘密鍵を使って共有シークレットを計算
                const sharedSecret = await handleDHMessage(data, myKeyRef.current.privateKey);
                
                // AES鍵を生成してRefに保存
                const derivedKey = await deriveAesKeySafe(sharedSecret, new Uint8Array(saltAll));
                aesKeyRef.current = derivedKey;

                console.log("✨✨ AES鍵が完成しました！");
                // デバッグ用: 鍵の表示が必要ならコメントアウトを外す
                // console.log("AES Key:", await arrayBufferToBase64(await crypto.subtle.exportKey("raw", derivedKey)));
            } catch (e) {
                console.error("鍵交換エラー:", e);
            }
        }
        // --- メッセージ受信 ---
        else if (data.type === "message" && data.name !== myDisplayName) {
            try {
                if (!aesKeyRef.current) return;

                const [iv, encryptedContent] = await Promise.all([
                    base64ToUint8Array(data.iv),
                    base64ToUint8Array(data.data)
                ]);

                const decryptedArray = await decrypt(aesKeyRef.current, iv, encryptedContent.buffer as ArrayBuffer);
                const messageText = new TextDecoder().decode(decryptedArray);

                addMessage(messageText, false, 'text', data.name);
            } catch (e) {
                console.error("復号失敗:", e);
            }
        }
      };

      ws.onclose = () => setStatus("切断");

    } catch (e) {
      console.error("初期化エラー:", e);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage || !wsRef.current || !aesKeyRef.current) {
        if (!aesKeyRef.current) console.error("エラー: 相手との暗号鍵がまだ確立されていません");
        return;
    }

    try {
        const encoder = new TextEncoder();
        const plaintext = encoder.encode(inputMessage);
        const encrypted = await encrypt(aesKeyRef.current, plaintext);

        const [ivB64, dataB64] = await Promise.all([
            arrayBufferToBase64(encrypted.iv),
            arrayBufferToBase64(encrypted.data)
        ]);

        const msg = {
            type: "message",
            room: roomName,
            name: myDisplayName,
            iv: ivB64,
            data: dataB64
        };

        wsRef.current.send(JSON.stringify(msg));
        console.log(`[送信完了]: ${inputMessage}`);
        
        addMessage(inputMessage, true, 'text');
        setInputMessage(""); // 入力欄をクリア

    } catch (e) {
        console.error("送信暗号化エラー:", e);
    }
  };

  // メッセージリストに追加するヘルパー関数
  const addMessage = (text: string, isMe: boolean, type: 'text' | 'system', senderName?: string) => {
    setMessages(prev => [...prev, {
        id: Date.now().toString() + Math.random(), // ユニークなID
        text,
        isMe,
        type,
        senderName
    }]);
  };

  // --- レンダリング (UI) ---
  
  // 1. ルーム選択画面
  if (!isInRoom) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f0f2f5', margin: 0 }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 12px 28px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="ルーム名を入力..."
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={{ width: '250px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '16px', marginBottom: '15px', display: 'block' }}
          />
          <button
            onClick={handleJoinRoom}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#0084ff', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ルームに参加
          </button>
        </div>
      </div>
    );
  }

  // 2. チャット画面
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      {/* ヘッダー */}
      <div style={{ padding: '15px', background: 'white', borderBottom: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
        Room: {roomName} <span style={{fontSize: '0.8em', color: status === '接続中' ? 'green' : 'red'}}>({status})</span>
      </div>

      {/* チャットエリア */}
      <div id="chatBox" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((msg) => {
            if (msg.type === 'system') {
                return <div key={msg.id} style={{ textAlign: 'center', color: '#888', fontSize: '12px', margin: '10px' }}>{msg.text}</div>;
            }
            return (
                <div key={msg.id} style={{
                    maxWidth: '70%',
                    padding: '8px 15px',
                    borderRadius: '18px',
                    fontSize: '15px',
                    alignSelf: msg.isMe ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.isMe ? '#0084ff' : '#e4e6eb',
                    color: msg.isMe ? 'white' : '#050505',
                    borderBottomRightRadius: msg.isMe ? '4px' : '18px',
                    borderBottomLeftRadius: msg.isMe ? '18px' : '4px',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap'
                }}>
                    {msg.text}
                </div>
            );
        })}
        {/* 自動スクロールのためのダミー要素 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div style={{ padding: '15px', background: 'white', display: 'flex', gap: '10px', borderTop: '1px solid #ddd' }}>
        <input
            type="text"
            placeholder="Aa"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: 'none', background: '#f0f2f5', outline: 'none' }}
        />
        <button
            onClick={handleSendMessage}
            style={{ background: 'none', border: 'none', color: '#0084ff', fontWeight: 'bold', cursor: 'pointer' }}
        >
            送信
        </button>
      </div>
    </div>
  );
};

export default ChatApp;