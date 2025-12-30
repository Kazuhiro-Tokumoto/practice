// npx vite build
import { generateEd25519KeyPair, generateX25519KeyPair } from "./mojyu-ru/crypto/ecdh.js";
import { arrayBufferToBase64, base64ToUint8Array } from "./mojyu-ru/base64.js";
import { generateSalt, generateMasterSeed } from "./mojyu-ru/crypto/saltaes.js";
import { decrypt, encrypt, deriveKeyFromPin, deriveSharedKey } from "./mojyu-ru/crypto/aes.js";
// @ts-ignore
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
async function main() {
    // --- 1. UI構築 ---
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
    // --- 2. データ・認証準備 ---
    const name = localStorage.getItem("my_name") ?? "不明なユーザー";
    const storedToken = localStorage.getItem("my_token") ?? "";
    const storedUuid = localStorage.getItem("my_uuid") ?? "";
    if (storedToken === "") {
        window.location.href = "../index.html";
        return;
    }
    const supabase = createClient('https://cedpfdoanarzyxcroymc.supabase.co', 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i', {
        global: { headers: { Authorization: `Bearer ${storedToken}` } },
    });
    // --- 3. 鍵関連の変数宣言 ---
    let myKeys = null; // 自分の鍵ペア
    let aeskey = null;
    let peerEdPubKey = null; // 相手の署名検証用
    let room;
    const wss = new WebSocket("wss://mail.shudo-physics.com/");
    // PIN入力用UI
    const pinContainer = document.createElement("div");
    pinContainer.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 15px; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 2000; width: 80%; max-width: 300px;`;
    const pininput = document.createElement("input");
    pininput.type = "password";
    pininput.placeholder = "PIN(数字)";
    pininput.inputMode = "numeric";
    pininput.style.cssText = `width: 100%; padding: 12px; font-size: 18px; text-align: center; border-radius: 8px; border: 2px solid #ddd; outline: none;`;
    const pinbtn = document.createElement("button");
    pinbtn.textContent = "鍵を復元してチャット開始";
    pinbtn.style.cssText = `width: 100%; padding: 15px; font-size: 16px; border-radius: 8px; border: none; background: #0084ff; color: white; font-weight: bold; cursor: pointer;`;
    const wipeLink = document.createElement("span");
    wipeLink.textContent = "データをすべて破棄";
    wipeLink.style.cssText = "color: #ff4d4d; cursor: pointer; font-size: 12px; text-decoration: underline; margin-top: 10px;";
    wipeLink.onclick = emergencyWipe;
    pinContainer.append(pininput, pinbtn, wipeLink);
    document.body.appendChild(pinContainer);
    // --- 4. 内部関数定義 ---
    async function emergencyWipe() {
        if (!confirm("データをすべて破棄しますか？"))
            return;
        await supabase.from('profile_users').update({ ed25519_pub: null, x25519_pub: null, ed25519_private: null, salt: null, iv: null }).eq('uuid', storedUuid);
        localStorage.clear();
        window.location.assign('https://kazuhiro-tokumoto.github.io/practice');
    }
    async function fetchMySecurityData() {
        const { data, error } = await supabase.from('profile_users').select('ed25519_private, salt, iv').eq('uuid', storedUuid).maybeSingle();
        return error || !data ? null : data;
    }
    async function restoreKey(pin) {
        const dbData = await fetchMySecurityData();
        if (!dbData || dbData.salt === null) {
            // 新規作成
            const salt = generateSalt();
            const masterSeed = generateMasterSeed(32);
            const aesKey = await deriveKeyFromPin(pin, salt);
            const encrypted = await encrypt(aesKey, masterSeed.buffer);
            const { privateKey, publicKey } = await generateEd25519KeyPair(new Uint8Array(masterSeed));
            const { privateKey: xPriv, publicKey: xPub } = await generateX25519KeyPair(new Uint8Array(masterSeed));
            await supabase.from('profile_users').update({
                ed25519_pub: await arrayBufferToBase64(await crypto.subtle.exportKey("raw", publicKey)),
                ed25519_private: await arrayBufferToBase64(encrypted.data),
                salt: await arrayBufferToBase64(salt),
                iv: await arrayBufferToBase64(encrypted.iv),
                x25519_pub: await arrayBufferToBase64(await crypto.subtle.exportKey("raw", xPub))
            }).eq('uuid', storedUuid);
            return { privateKey, publicKey, xPriv, xPub };
        }
        else {
            // 復元
            const salt = await base64ToUint8Array(dbData.salt);
            const iv = await base64ToUint8Array(dbData.iv);
            const encryptedSeed = await base64ToUint8Array(dbData.ed25519_private);
            const aesKey = await deriveKeyFromPin(pin, salt);
            const seed = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv.buffer }, aesKey, encryptedSeed.buffer));
            const keysEd = await generateEd25519KeyPair(seed);
            const keysX = await generateX25519KeyPair(seed);
            return { ...keysEd, xPriv: keysX.privateKey, xPub: keysX.publicKey };
        }
    }
    async function ed25519Handler(mode, key, dataB64, sigB64 = "") {
        const dataUint8 = new TextEncoder().encode(dataB64);
        if (mode === 1) {
            const signature = await window.crypto.subtle.sign({ name: "Ed25519" }, key, dataUint8);
            return await arrayBufferToBase64(signature);
        }
        else {
            const sigUint8 = await base64ToUint8Array(sigB64);
            return await window.crypto.subtle.verify({ name: "Ed25519" }, key, sigUint8, dataUint8);
        }
    }
    async function testPublicKeyFetch(targetUuid) {
        const { data } = await supabase.from('public_profiles').select('*').eq('uuid', targetUuid).maybeSingle();
        return data;
    }
    async function sendEncryptedMessage(text, aeskey) {
        if (!aeskey || !myKeys)
            return;
        try {
            const encrypted = await encrypt(aeskey, new TextEncoder().encode(text));
            const [ivB64, dataB64] = await Promise.all([arrayBufferToBase64(encrypted.iv), arrayBufferToBase64(encrypted.data)]);
            const sig = await ed25519Handler(1, myKeys.privateKey, dataB64);
            wss.send(JSON.stringify({ type: "message", room, name, uuid: storedUuid, iv: ivB64, data: dataB64, sig }));
            addBubble(text, true);
        }
        catch (e) {
            console.error("送信失敗:", e);
        }
    }
    function addBubble(text, isMe) {
        const bubble = document.createElement("div");
        bubble.style.cssText = `max-width: 70%; padding: 8px 15px; border-radius: 18px; align-self: ${isMe ? "flex-end" : "flex-start"}; background-color: ${isMe ? "#0084ff" : "#e4e6eb"}; color: ${isMe ? "white" : "black"}; word-break: break-all;`;
        bubble.textContent = text;
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    function addSystemMsg(msg) {
        const p = document.createElement("div");
        p.textContent = msg;
        p.style.cssText = "text-align: center; color: #888; font-size: 12px; margin: 10px;";
        chatBox.appendChild(p);
    }
    // --- 5. 通信・イベント処理 ---
    wss.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "DH" && data.name !== name) {
            const peerData = await testPublicKeyFetch(data.uuid);
            if (peerData && peerData.x25519_pub) {
                const peerXRaw = await base64ToUint8Array(peerData.x25519_pub);
                const theirXKey = await window.crypto.subtle.importKey("raw", peerXRaw, { name: "X25519" }, true, []);
                aeskey = await deriveSharedKey(myKeys.xPriv, theirXKey);
                const peerEdRaw = await base64ToUint8Array(peerData.ed25519_pub);
                peerEdPubKey = await window.crypto.subtle.importKey("raw", peerEdRaw, { name: "Ed25519" }, true, ["verify"]);
                console.log("✨ 鍵合体完了");
            }
        }
        else if (data.type === "message" && data.name !== name) {
            try {
                if (!aeskey || !peerEdPubKey)
                    return;
                const [iv, encrypted] = await Promise.all([base64ToUint8Array(data.iv), base64ToUint8Array(data.data)]);
                const isValid = await ed25519Handler(2, peerEdPubKey, data.data, data.sig);
                if (!isValid)
                    return console.error("署名検証失敗");
                const decrypted = await decrypt(aeskey, iv, encrypted.buffer);
                addBubble(new TextDecoder().decode(decrypted), false);
            }
            catch (e) {
                console.error("復号失敗", e);
            }
        }
        // (join-ack等の処理もここに残す)
    };
    btnroom.addEventListener("click", () => {
        room = inputroom.value || "defaultroom";
        chatHeader.textContent = `Room: ${room}`;
        roomSelection.style.display = "none";
        chatContainer.style.display = "flex";
        wss.send(JSON.stringify({ type: "join", room, name, uuid: storedUuid, token: storedToken }));
    });
    sendBtn.onclick = () => { if (input.value && aeskey)
        sendEncryptedMessage(input.value, aeskey); input.value = ""; };
    // --- 6. 起動フロー制御 ---
    const storedPin = localStorage.getItem("pin");
    if (storedPin === null) {
        pinContainer.style.display = "flex";
        roomSelection.style.display = "none";
        pinbtn.onclick = async () => {
            myKeys = await restoreKey(pininput.value);
            localStorage.setItem("pin", pininput.value);
            pinContainer.style.display = "none";
            roomSelection.style.display = "flex";
        };
    }
    else {
        pinContainer.style.display = "none";
        myKeys = await restoreKey(storedPin);
    }
}
main();
