import { generateKeyPair,deriveSharedSecret } from "./mojyu-ru/crypto/ecdh.js";
import { arrayBufferToBase64 , base64ToUint8Array,bufferToHex} from "./mojyu-ru/base64.js";
import { generateSalt, combineSalts } from "./mojyu-ru/crypto/saltaes.js";
import { handleDHMessage,  } from "./mojyu-ru/dh.js";
import {dhs} from "./mojyu-ru/joins.js";
import { deriveAesKeySafe } from "./mojyu-ru/crypto/kdf.js";
import { decrypt,encrypt } from "./mojyu-ru/crypto/aes.js";


// メッセージ送信用の関数
async function sendEncryptedMessage(text: string,aeskey:any) {
    const txt = `[送信]: ${text}` ;
    if (!aeskey) {
        console.error("エラー: AES鍵がまだ生成されていません。相手が接続するまで待ってください。");
        return;
    }

    try {
        // 1. 文字列をバイナリ(Uint8Array)に変換
        const encoder = new TextEncoder();
        const plaintext = encoder.encode(text);

        // 2. AES-GCMで暗号化
        // encrypt関数は { iv: Uint8Array, data: ArrayBuffer } を返す想定
        const encrypted = await encrypt(aeskey, plaintext);

        // 3. サーバーに送信
        const msg = {
            type: "message",
            room: room,
            name: name,
            iv: arrayBufferToBase64(encrypted.iv), // IVをBase64化
            data: arrayBufferToBase64(encrypted.data) // 暗号文をBase64化
        };

        wss.send(JSON.stringify(msg));
        console.log(`%c[送信完了]: ${text}`, "color: #00bfff; font-weight: bold;");
    } catch (e) {
        console.error("送信時の暗号化に失敗しました:", e);
    }
            const p = document.createElement("p");
            p.textContent = txt;
            chatBox.appendChild(p);
            chatBox.appendChild(br);
}
(window as any).sendMsg = sendEncryptedMessage;

// ブラウザのコンソールから直接実行できるように globalThis (window) に登録

const room:string = "test-room";
let aeskey:any;
const salt:  Uint8Array = generateSalt();
const base64salt = arrayBufferToBase64(salt);
const mykey = await generateKeyPair();
const name = await bufferToHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(Math.random().toString())));
let txt

console.log(name);

const pubJwk = await crypto.subtle.exportKey("jwk", mykey.publicKey);

const wss:WebSocket = new WebSocket("wss://mail.shudo-physics.com:40000/");
{ //gemini最強
wss.onopen = () => {
    wss.send(JSON.stringify({ type: "join", room: room, name: name.toString() }));
            const p = document.createElement("p");
            p.textContent = "参加しました";
            chatBox.appendChild(p);
            chatBox.appendChild(br);
}
wss.onmessage = async (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    console.log("受信メッセージ:", data);
    if (data.type === "join-broadcast") {
            const p = document.createElement("p");
            p.textContent = data.name + "が参加しました";
            chatBox.appendChild(p);
            chatBox.appendChild(br);
    }
    // 1. サーバーからの開始合図
    if (data.type === "dh-start" || data.type === "join-broadcast") {
        if (data.name === name) return; 

        // dhs はオブジェクトを返すように修正済みの想定
        const dhmsg = dhs(event, pubJwk, base64salt, name, room);
        if (dhmsg) {
            wss.send(JSON.stringify(dhmsg));
            console.log("自分のDHを送信完了");
        }
    } 
    
    // 2. 相手から「DH（鍵情報）」が届いた場合
    // ※ data の再宣言 (const data = ...) を削除しました
    else if (data.type === "DH" && data.name !== name) {
        try {
            // 1. Saltのデコードと結合
            const remoteSalt = base64ToUint8Array(data.salt);
            const saltall = combineSalts(salt, remoteSalt);

            // 2. handleDHMessage (dh.ts) を呼び出し
            // 内部で importKey と deriveBits を一気に行う
            const sharedSecret = await handleDHMessage(data, mykey.privateKey);
            console.log("共有秘密(Shared Secret):", new Uint8Array(sharedSecret));
            // 3. 最終的なAES鍵を生成
            aeskey = await deriveAesKeySafe(sharedSecret, new Uint8Array(saltall));

            console.log("✨✨ AES鍵が完成しました！", aeskey);
        } catch (e) {
            console.error("鍵交換エラー:", e);
        }
    }else if (data.type === "message" && data.name !== name) {
        try {
            if (!aeskey) {
                console.warn("メッセージを受信しましたが、まだ鍵がありません。");
                return;
            }

            // Base64からバイナリに戻す
            const iv = base64ToUint8Array(data.iv);
            const encryptedContent = base64ToUint8Array(data.data);

            // 復号
            const decryptedArray = await decrypt(aeskey, iv, encryptedContent.buffer as ArrayBuffer);
            const messageText = new TextDecoder().decode(decryptedArray);

            txt = `[受信]: ${messageText}`, "color: #00ff00; font-weight: bold;"
            const p = document.createElement("p");
            p.textContent = txt;
            chatBox.appendChild(p);
            chatBox.appendChild(br);


            console.log(`%c[受信]: ${messageText}`, "color: #00ff00; font-weight: bold;");
        } catch (e) {
            console.error("復号に失敗しました。鍵が一致していない可能性があります:", e);
        }
    }
};
}

// 以下、簡易的なUIのセットアップ（HTMLがない場合の代替手段）

// 1. input要素を作成
const chatBox = document.createElement("div");
chatBox.id = "chatBox";
chatBox.style.cssText = `
    width: 95%;
    max-width: 600px;
    height: 60vh; /* スマホでキーボードが出ても大丈夫な高さ */
    border: 1px solid #ddd;
    background-color: #f0f2f5;
    overflow-y: auto;
    padding: 15px;
    margin: 10px auto;
    display: flex;
    flex-direction: column;
    font-family: sans-serif;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;
document.body.appendChild(chatBox);

// 2. 入力エリア
const inputContainer = document.createElement("div");
inputContainer.style.cssText = "width: 95%; max-width: 600px; margin: 0 auto; display: flex; gap: 5px;";

const input = document.createElement("input");
input.placeholder = "メッセージを入力...";
input.style.cssText = "flex: 1; padding: 10px; border-radius: 20px; border: 1px solid #ccc; outline: none; font-size: 16px;";

const sendBtn = document.createElement("button");
sendBtn.textContent = "送信";
sendBtn.style.cssText = "padding: 10px 20px; border-radius: 20px; border: none; background: #0084ff; color: white; font-weight: bold; cursor: pointer;";

inputContainer.appendChild(input);
inputContainer.appendChild(sendBtn);
document.body.appendChild(inputContainer);
const br = document.createElement("br");


// 3. クリックイベント（作成した変数をそのまま使うのが楽です）
sendBtn.addEventListener("click", async () => {
    // input 変数をそのまま使えるので getElementById は不要
    if (input.value) {
        await sendEncryptedMessage(input.value,aeskey);
        input.value = ""; // 送信後に中身を空にする
    }
});

// オマケ：Enterキーでも送れるようにする
input.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && input.value) {
        await sendEncryptedMessage(input.value,aeskey);
        input.value = "";
    }
});
chatBox.scrollTop = chatBox.scrollHeight;