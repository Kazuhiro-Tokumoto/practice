import { generateKeyPair, deriveSharedSecret } from "./crypto/ecdh.js";
import { arrayBufferToBase64, base64ToUint8Array, bufferToHex } from "./base64.js";
import { generateSalt, combineSalts } from "./crypto/saltaes.js";
import { handleDHMessage } from "./dh.js";
import { dhs } from "./joins.js";
import { deriveAesKeySafe } from "./crypto/kdf.js";
import { decrypt, encrypt } from "./crypto/aes.js";
export async function main(){

// 1. 変数名を 'name' から 'myDisplayName' などに変更
// 2. localStorage からの取得時に null を回避する (?? "")

// --- 1. UIスタイル設定 (Messenger風) ---


// --- 1. UIスタイル設定 ---
document.body.style.cssText = "margin: 0; padding: 0; background-color: #f0f2f5; font-family: sans-serif;";

const roomSelection = document.createElement("div");
roomSelection.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;";
const roomCard = document.createElement("div");
roomCard.style.cssText = "background: white; padding: 30px; border-radius: 15px; box-shadow: 0 12px 28px rgba(0,0,0,0.1); text-align: center;";
const inputroom = document.createElement("input");
inputroom.placeholder = "ルーム名を入力...";
inputroom.style.cssText = "width: 250px; padding: 12px; border-radius: 8px; border: 1px solid #ddd; outline: none; font-size: 16px; margin-bottom: 15px; display: block;";
const btnroom = document.createElement("button");
btnroom.textContent = "ルームに参加";
btnroom.style.cssText = "width: 100%; padding: 12px; border-radius: 8px; border: none; background: #0084ff; color: white; font-weight: bold; cursor: pointer;";
roomCard.append(inputroom, btnroom);
roomSelection.append(roomCard);
document.body.appendChild(roomSelection);

const chatContainer = document.createElement("div");
chatContainer.style.cssText = "display: none; height: 100vh; flex-direction: column;";
const chatHeader = document.createElement("div");
chatHeader.style.cssText = "padding: 15px; background: white; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold;";
const chatBox = document.createElement("div");
chatBox.id = "chatBox";
chatBox.style.cssText = "flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px;";
const inputContainer = document.createElement("div");
inputContainer.style.cssText = "padding: 15px; background: white; display: flex; gap: 10px; border-top: 1px solid #ddd;";
const input = document.createElement("input");
input.placeholder = "Aa";
input.style.cssText = "flex: 1; padding: 10px 15px; border-radius: 20px; border: none; background: #f0f2f5; outline: none;";
const sendBtn = document.createElement("button");
sendBtn.textContent = "送信";
sendBtn.style.cssText = "background: none; border: none; color: #0084ff; font-weight: bold; cursor: pointer;";
inputContainer.append(input, sendBtn);
chatContainer.append(chatHeader, chatBox, inputContainer);
document.body.appendChild(chatContainer);
// 1. 変数名を 'name' から 'myDisplayName' などに変更
// 2. localStorage からの取得時に null を回避する (?? "")
let myDisplayName = "不明なユーザー";
const storedToken = localStorage.getItem("my_token") ?? "";
const storedUuid = localStorage.getItem("my_uuid") ?? "";
myDisplayName = localStorage.getItem("my_name") ?? "不明なユーザー";

// 3. 型チェック（空文字＝ログインしていない）
if (storedToken === "") {
    window.location.href = "../index.html";
} else {
    // WebSocket送信部分
    btnroom.addEventListener("click", () => {
        const wss = new WebSocket("wss://mail.shudo-physics.com");

        wss.onopen = () => {
            const payload = {
                type: "join",
               room: inputroom.value || "default",
                name: myDisplayName, // ここを 'name' ではなく変更した変数にする
                uuid: storedUuid,
                token: storedToken
            };
            wss.send(JSON.stringify(payload));
        };
    });
}

function addBubble(text, isMe) {
        const bubble = document.createElement("div");
        bubble.style.cssText = `
            max-width: 70%; 
            padding: 8px 15px; 
            border-radius: 18px; 
            font-size: 15px; 
            align-self: ${isMe ? "flex-end" : "flex-start"}; 
            background-color: ${isMe ? "#0084ff" : "#e4e6eb"}; 
            color: ${isMe ? "white" : "#050505"}; 
            ${isMe ? "border-bottom-right-radius: 4px;" : "border-bottom-left-radius: 4px;"};
            
            /* --- ここから下が追加分 --- */
            word-break: break-all;      /* 枠の端で強制的に改行させる */
            overflow-wrap: break-word;  /* 長い単語をはみ出させない */
            white-space: pre-wrap;      /* 改行やスペースを維持する */
        `;
        bubble.textContent = text;
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

function addSystemMsg(msg: string) {
    const p = document.createElement("div");
    p.textContent = msg;
    p.style.cssText = "text-align: center; color: #888; font-size: 12px; margin: 10px;";
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}


    // --- ★ 保管庫から「ブツ」を取り出す ---


// --- 2. 既存ロジック変数 ---
let wss: WebSocket = new WebSocket('wss://mail.shudo-physics.com/');
let room: string;
let aeskey: any;
const salt: Uint8Array = generateSalt();
const base64salt = arrayBufferToBase64(salt);
const mykey = await generateKeyPair();
const pubJwk = await crypto.subtle.exportKey("jwk", mykey.publicKey);
let name: string = myDisplayName;


async function sendEncryptedMessage(text: string, aeskey: any) {
    if (!aeskey) {
        console.error("エラー: AES鍵がまだ生成されていません。相手が接続するまで待ってください。");
        return;
    }
    try {
        const encoder = new TextEncoder();
        const plaintext = encoder.encode(text);
        
        // 1. 暗号化（ここは元から async）
        const encrypted = await encrypt(aeskey, plaintext);

        // 2. Base64変換（ここを高速版の await に書き換え！）
        // iv と data の両方を並列で変換するとさらに効率がいいよ
        const [ivB64, dataB64] = await Promise.all([
            arrayBufferToBase64(encrypted.iv),
            arrayBufferToBase64(encrypted.data)
        ]);

        const msg = {
            type: "message", 
            room: room, 
            name: name,
            iv: ivB64,   // 変換後の値を入れる
            data: dataB64 // 変換後の値を入れる
        };

        // 3. 送信
        wss.send(JSON.stringify(msg));
        
        console.log(`%c[送信完了]: ${text}`, "color: #00bfff; font-weight: bold;");
        addBubble(text, true);
    } catch (e) { 
        console.error("送信時の暗号化に失敗しました:", e); 
    }
}


window.addEventListener("beforeunload", () => {
    if (wss && wss.readyState === WebSocket.OPEN) {
        wss.send(JSON.stringify({ type: "leave", room: room, name: name }));
    }
});

btnroom.addEventListener("click", () => {
    room = inputroom.value || "defaultroom";
    chatHeader.textContent = `Room: ${room}`;
    roomSelection.style.display = "none";
    chatContainer.style.display = "flex";

    wss = new WebSocket("wss://mail.shudo-physics.com/");

    wss.onopen = () => {
        wss.send(JSON.stringify({ type: "join", room: room, name: name,uuid: storedUuid,token: storedToken }));
        // ここでの「参加しました」表示を削除し、onmessageのackを待つように変更
    }

    wss.onmessage = async (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log("受信メッセージ:", data);

        if (data.type === "join-ack") {
            addSystemMsg("参加しました");
        }
        if (data.type === "join-nack") {
            addSystemMsg("エラー: ルームに参加できませんでした");
        }

        if (data.type === "quit-broadcast" || data.type === "leave" || data.type === "leave-broadcast") {
            addSystemMsg((data.name ? data.name.substring(0, 8) : "誰か") + "が退出しました");
        }

        if (data.type === "join-broadcast") {
            addSystemMsg(data.name.substring(0, 8) + "が参加しました");
        }

        if (data.type === "dh-start" || data.type === "join-broadcast") {
            if (data.name === name) return; 
            const dhmsg = dhs(event, pubJwk, base64salt, name, room);
            if (dhmsg) {
                wss.send(JSON.stringify(dhmsg));
                console.log("自分のDHを送信完了");
            }
        } 
        else if (data.type === "DH" && data.name !== name) {
            try {
                const remoteSalt = base64ToUint8Array(data.salt);
                const saltall = combineSalts(salt, remoteSalt);
                const sharedSecret = await handleDHMessage(data, mykey.privateKey);
                console.log("共有秘密(Shared Secret):", new Uint8Array(sharedSecret));
                aeskey = await deriveAesKeySafe(sharedSecret, new Uint8Array(saltall));
                console.log("✨✨ AES鍵が完成しました！", aeskey);
            } catch (e) { console.error("鍵交換エラー:", e); }
        } else if (data.type === "message" && data.name !== name) {
            try {
                if (!aeskey) { console.warn("メッセージを受信しましたが、まだ鍵がありません。"); return; }
                const iv = base64ToUint8Array(data.iv);
                const encryptedContent = base64ToUint8Array(data.data);
                const decryptedArray = await decrypt(aeskey, iv, encryptedContent.buffer as ArrayBuffer);
                const messageText = new TextDecoder().decode(decryptedArray);
                addBubble(messageText, false);
                console.log(`%c[受信]: ${messageText}`, "color: #00ff00; font-weight: bold;");
            } catch (e) { console.error("復号に失敗しました。鍵が一致していない可能性があります:", e); }
        }
    };
});

sendBtn.addEventListener("click", async () => {
    if (input.value) { await sendEncryptedMessage(input.value, aeskey); input.value = ""; }
});
input.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && input.value) { await sendEncryptedMessage(input.value, aeskey); input.value = ""; }
    
});
}