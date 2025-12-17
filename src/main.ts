import { generateKeyPair } from "./mojyu-ru/crypto/ecdh.js";
import { arrayBufferToBase64, base64ToUint8Array, bufferToHex } from "./mojyu-ru/base64.js";
import { generateSalt, combineSalts } from "./mojyu-ru/crypto/saltaes.js";
import { handleDHMessage } from "./mojyu-ru/dh.js";
import { dhs } from "./mojyu-ru/joins.js";
import { deriveAesKeySafe } from "./mojyu-ru/crypto/kdf.js";
import { decrypt, encrypt } from "./mojyu-ru/crypto/aes.js";

// --- 1. UIの構築 (初期状態) ---
const lobby = document.createElement("div");
lobby.style.cssText = "text-align: center; padding: 20px; font-family: sans-serif;";
const inputroom = document.createElement("input");
inputroom.placeholder = "ルーム名を入力...";
inputroom.style.cssText = "padding: 10px; border-radius: 5px; border: 1px solid #ccc;";
const btnroom = document.createElement("button");
btnroom.textContent = "参加";
btnroom.style.cssText = "padding: 10px 20px; margin-left: 5px; cursor: pointer; background: #0084ff; color: white; border: none; border-radius: 5px;";

lobby.append(inputroom, btnroom);
document.body.appendChild(lobby);

// チャットエリア（最初は隠す）
const chatArea = document.createElement("div");
chatArea.style.display = "none";
const chatBox = document.createElement("div");
chatBox.style.cssText = "width: 95%; max-width: 600px; height: 60vh; border: 1px solid #ddd; background: #f9f9f9; overflow-y: auto; padding: 15px; margin: 10px auto; display: flex; flex-direction: column; border-radius: 10px;";
const inputContainer = document.createElement("div");
inputContainer.style.cssText = "width: 95%; max-width: 600px; margin: 0 auto; display: flex; gap: 5px;";
const inputMsg = document.createElement("input");
inputMsg.style.cssText = "flex: 1; padding: 10px; border-radius: 20px; border: 1px solid #ccc;";
const sendBtn = document.createElement("button");
sendBtn.textContent = "送信";
sendBtn.style.cssText = "padding: 10px 20px; border-radius: 20px; background: #0084ff; color: white; border: none;";

inputContainer.append(inputMsg, sendBtn);
chatArea.append(chatBox, inputContainer);
document.body.appendChild(chatArea);

// --- 2. 暗号化・通信用変数 ---
let wss: WebSocket;
let roomName: string;
let aeskey: CryptoKey | null = null;
const mySalt = generateSalt();
const myKeyPair = await generateKeyPair();
const myName = await bufferToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(Math.random().toString())));
const pubJwk = await crypto.subtle.exportKey("jwk", myKeyPair.publicKey);

// --- 3. メッセージ表示ヘルパー ---
const addUI = (text: string, type: 'me' | 'other' | 'system', sender = "") => {
    const div = document.createElement("div");
    if (type === 'system') {
        div.style.cssText = "align-self: center; color: #888; font-size: 0.8em; margin: 5px;";
        div.textContent = text;
    } else {
        const isMe = type === 'me';
        div.style.cssText = `align-self: ${isMe ? "flex-end" : "flex-start"}; background: ${isMe ? "#0084ff" : "#eee"}; color: ${isMe ? "#fff" : "#000"}; padding: 8px 12px; margin: 4px; border-radius: 15px; max-width: 80%;`;
        div.textContent = (isMe ? "" : sender.substring(0, 5) + ": ") + text;
    }
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
};

// --- 4. 参加ボタンイベント ---
btnroom.onclick = () => {
    roomName = inputroom.value.trim() || "default-room";
    lobby.style.display = "none";
    chatArea.style.display = "block";
    
    wss = new WebSocket("wss://mail.shudo-physics.com:40000/");
    
    wss.onopen = () => {
        wss.send(JSON.stringify({ type: "join", room: roomName, name: myName }));
        addUI(`ルーム「${roomName}」に参加中...`, 'system');
    };

    wss.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === "join-broadcast" && data.name !== myName) {
            addUI(`${data.name.substring(0, 5)}が参加`, 'system');
            const dhmsg = dhs(event, pubJwk, arrayBufferToBase64(mySalt), myName, roomName);
            if (dhmsg) wss.send(JSON.stringify(dhmsg));
        } 
        else if (data.type === "DH" && data.name !== myName) {
            const sharedSecret = await handleDHMessage(data, myKeyPair.privateKey);
            const saltall = combineSalts(mySalt, base64ToUint8Array(data.salt));
            aeskey = await deriveAesKeySafe(sharedSecret, new Uint8Array(saltall));
            addUI("🔒 暗号化が有効になりました", 'system');
        } 
        else if (data.type === "message" && data.name !== myName) {
            if (!aeskey) return;
            const decrypted = await decrypt(aeskey, base64ToUint8Array(data.iv), base64ToUint8Array(data.data).buffer as ArrayBuffer);
            addUI(new TextDecoder().decode(decrypted), 'other', data.name);
        }
    };
};

// --- 5. 送信イベント ---
sendBtn.onclick = async () => {
    if (!inputMsg.value || !aeskey) return;
    const text = inputMsg.value;
    const encrypted = await encrypt(aeskey, new TextEncoder().encode(text));
    wss.send(JSON.stringify({
        type: "message", room: roomName, name: myName,
        iv: arrayBufferToBase64(encrypted.iv),
        data: arrayBufferToBase64(encrypted.data)
    }));
    addUI(text, 'me');
    inputMsg.value = "";
};