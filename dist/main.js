import { generateKeyPair } from "./mojyu-ru/crypto/ecdh.js";
import { arrayBufferToBase64, base64ToUint8Array, bufferToHex } from "./mojyu-ru/base64.js";
import { generateSalt, combineSalts } from "./mojyu-ru/crypto/saltaes.js";
import { handleDHMessage } from "./mojyu-ru/dh.js";
import { dhs } from "./mojyu-ru/joins.js";
import { deriveAesKeySafe } from "./mojyu-ru/crypto/kdf.js";
import { decrypt, encrypt } from "./mojyu-ru/crypto/aes.js";
// --- UI部分 (Messenger風デザイン) ---
document.body.style.cssText = "margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;";
const roomSelection = document.createElement("div");
roomSelection.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;";
const roomCard = document.createElement("div");
roomCard.style.cssText = "background: white; padding: 30px; border-radius: 15px; box-shadow: 0 12px 28px rgba(0,0,0,0.12); text-align: center;";
const inputroom = document.createElement("input");
inputroom.placeholder = "ルーム名を入力...";
inputroom.style.cssText = "width: 250px; padding: 12px; border-radius: 8px; border: 1px solid #ddd; outline: none; font-size: 16px; display: block; margin-bottom: 15px;";
const btnroom = document.createElement("button");
btnroom.textContent = "ルームに参加";
btnroom.style.cssText = "width: 100%; padding: 12px; border-radius: 8px; border: none; background: #0084ff; color: white; font-weight: bold; font-size: 16px; cursor: pointer;";
roomCard.append(inputroom, btnroom);
roomSelection.append(roomCard);
document.body.appendChild(roomSelection);
const chatContainer = document.createElement("div");
chatContainer.style.cssText = "display: none; height: 100vh; flex-direction: column;";
document.body.appendChild(chatContainer);
const chatHeader = document.createElement("div");
chatHeader.style.cssText = "padding: 15px; background: white; border-bottom: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 18px; color: #050505;";
chatContainer.appendChild(chatHeader);
const chatBox = document.createElement("div");
chatBox.id = "chatBox";
chatBox.style.cssText = "flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px;";
chatContainer.appendChild(chatBox);
const inputContainer = document.createElement("div");
inputContainer.style.cssText = "padding: 15px; background: white; display: flex; align-items: center; gap: 10px; border-top: 1px solid #ddd;";
const input = document.createElement("input");
input.placeholder = "Aa";
input.style.cssText = "flex: 1; padding: 10px 15px; border-radius: 20px; border: none; background: #f0f2f5; outline: none; font-size: 16px;";
const sendBtn = document.createElement("button");
sendBtn.textContent = "送信";
sendBtn.style.cssText = "background: none; border: none; color: #0084ff; font-weight: bold; font-size: 16px; cursor: pointer; padding: 5px 10px;";
inputContainer.append(input, sendBtn);
chatContainer.appendChild(inputContainer);
// 吹き出し作成ヘルパー
function addBubble(text, isMe) {
    const bubble = document.createElement("div");
    bubble.style.cssText = `
        max-width: 70%;
        padding: 8px 15px;
        border-radius: 18px;
        font-size: 15px;
        line-height: 1.4;
        word-wrap: break-word;
        align-self: ${isMe ? "flex-end" : "flex-start"};
        background-color: ${isMe ? "#0084ff" : "#e4e6eb"};
        color: ${isMe ? "white" : "#050505"};
        ${isMe ? "border-bottom-right-radius: 4px;" : "border-bottom-left-radius: 4px;"}
    `;
    bubble.textContent = text;
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}
// --- 以下、ロジック部分は一切変えずに変数名のみUIに紐付け ---
let wss;
let room;
let aeskey;
const salt = generateSalt();
const base64salt = arrayBufferToBase64(salt);
const mykey = await generateKeyPair();
const name = await bufferToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(Math.random().toString())));
let txt;
console.log(name);
const pubJwk = await crypto.subtle.exportKey("jwk", mykey.publicKey);
async function sendEncryptedMessage(text, aeskey) {
    if (!aeskey) {
        console.error("エラー: AES鍵がまだ生成されていません。相手が接続するまで待ってください。");
        return;
    }
    try {
        const encoder = new TextEncoder();
        const plaintext = encoder.encode(text);
        const encrypted = await encrypt(aeskey, plaintext);
        const msg = {
            type: "message",
            room: room,
            name: name,
            iv: arrayBufferToBase64(encrypted.iv),
            data: arrayBufferToBase64(encrypted.data)
        };
        wss.send(JSON.stringify(msg));
        console.log(`%c[送信完了]: ${text}`, "color: #00bfff; font-weight: bold;");
        addBubble(text, true); // 自分の吹き出しを表示
    }
    catch (e) {
        console.error("送信時の暗号化に失敗しました:", e);
    }
}
btnroom.addEventListener("click", () => {
    room = inputroom.value || "defaultroom";
    chatHeader.textContent = `Room: ${room}`;
    roomSelection.style.display = "none";
    chatContainer.style.display = "flex";
    wss = new WebSocket("wss://mail.shudo-physics.com:40000/");
    wss.onopen = () => {
        wss.send(JSON.stringify({ type: "join", room: room, name: name.toString() }));
        const p = document.createElement("div");
        p.textContent = "参加しました";
        p.style.cssText = "text-align: center; color: #888; font-size: 12px; margin: 10px;";
        chatBox.appendChild(p);
    };
    wss.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("受信メッセージ:", data);
        if (data.type === "join-broadcast") {
            const p = document.createElement("div");
            p.textContent = data.name.substring(0, 8) + "が参加しました";
            p.style.cssText = "text-align: center; color: #888; font-size: 12px; margin: 10px;";
            chatBox.appendChild(p);
        }
        if (data.type === "dh-start" || data.type === "join-broadcast") {
            if (data.name === name)
                return;
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
            }
            catch (e) {
                console.error("鍵交換エラー:", e);
            }
        }
        else if (data.type === "message" && data.name !== name) {
            try {
                if (!aeskey) {
                    console.warn("メッセージを受信しましたが、まだ鍵がありません。");
                    return;
                }
                const iv = base64ToUint8Array(data.iv);
                const encryptedContent = base64ToUint8Array(data.data);
                const decryptedArray = await decrypt(aeskey, iv, encryptedContent.buffer);
                const messageText = new TextDecoder().decode(decryptedArray);
                addBubble(messageText, false); // 相手の吹き出しを表示
                console.log(`%c[受信]: ${messageText}`, "color: #00ff00; font-weight: bold;");
            }
            catch (e) {
                console.error("復号に失敗しました。鍵が一致していない可能性があります:", e);
            }
        }
    };
});
sendBtn.addEventListener("click", async () => {
    if (input.value) {
        await sendEncryptedMessage(input.value, aeskey);
        input.value = "";
    }
});
input.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && input.value) {
        await sendEncryptedMessage(input.value, aeskey);
        input.value = "";
    }
});
