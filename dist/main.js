//npx wscat -c wss://mail.shudo-physics.com/
import { generateEd25519KeyPair, generateX25519KeyPair } from "./mojyu-ru/crypto/ecdh.js";
import { arrayBufferToBase64, base64ToUint8Array } from "./mojyu-ru/base64.js"; // 16進数変換のみ残す
import { generateSalt, generateMasterSeed } from "./mojyu-ru/crypto/saltaes.js";
import { dhs } from "./mojyu-ru/joins.js";
import { deriveAesKeySafe, testPublicKeyFetch } from "./mojyu-ru/crypto/kdf.js";
import { decrypt, encrypt, deriveKeyFromPin, deriveSharedKey, aesKeyToArray } from "./mojyu-ru/crypto/aes.js";
// @supabase/supabase-js ではなく、URLを直接指定する
// @ts-ignore
import { createClient
// @ts-ignore
 } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { sha256, sha512, combine } from "./mojyu-ru/crypto/hash.js";
// --- 実行デモ ---
// 32バイトのシード（本来はPINから生成）
async function main() {
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
    function addMediaBubble(url, uuidName, originalName, isMe, subType) {
        const container = document.createElement("div");
        container.style.cssText = `
        max-width: 70%; 
        margin: 10px 0;
        padding: 8px;
        align-self: ${isMe ? "flex-end" : "flex-start"};
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: ${isMe ? "#0084ff" : "#e4e6eb"};
        border-radius: 15px;
        ${isMe ? "border-bottom-right-radius: 4px;" : "border-bottom-left-radius: 4px;"}
    `;
        const isVideo = originalName.toLowerCase().endsWith(".mp4") ||
            originalName.toLowerCase().endsWith(".mov") ||
            originalName.toLowerCase().endsWith(".webm");
        const isAudio = originalName.toLowerCase().endsWith(".m4a") || originalName.toLowerCase().endsWith(".mp3") || originalName.toLowerCase().endsWith(".wav") || subType === "audio";
        const displayName = originalName || uuidName;
        if (subType === "image") {
            const img = document.createElement("img");
            img.src = url;
            img.style.cssText = "width: 100%; max-width: 250px; border-radius: 12px;";
            container.appendChild(img);
        }
        else if (isVideo) {
            // 動画プレーヤー
            const video = document.createElement("video");
            video.src = url;
            video.controls = true;
            video.style.cssText = "width: 100%; max-width: 250px; border-radius: 12px;";
            container.appendChild(video);
        }
        else if (isAudio) {
            // --- 🎤 ここ！音声プレーヤーを確実に呼び出す ---
            const audio = document.createElement("audio");
            audio.src = url;
            audio.controls = true;
            // m4aなどはブラウザによってサイズが不安定なので幅を固定する
            audio.style.cssText = "width: 100%; min-width: 200px; max-width: 250px; height: 40px;";
            container.appendChild(audio);
            const link = document.createElement("a");
            link.href = url;
            link.download = uuidName;
            link.textContent = `${displayName}`;
            link.style.cssText = `
            padding: 10px; background: rgba(255,255,255,0.2);
            color: ${isMe ? "white" : "#0084ff"}; border-radius: 8px;
            text-decoration: none; font-weight: bold; text-align: center;
            border: 1px solid rgba(0,0,0,0.1);
        `;
            container.appendChild(link);
        }
        // ファイル名ラベル（共通）
        const nameLabel = document.createElement("a");
        nameLabel.href = url; // 復号されたデータのURL
        nameLabel.download = originalName; // 保存時のファイル名（UUID）
        nameLabel.textContent = `DLfile ${displayName}`; // 画面上の表示名
        nameLabel.style.cssText = `
    font-size: 11px; 
    color: ${isMe ? "rgba(255,255,255,0.9)" : "#0084ff"}; 
    margin-top: 4px;
    text-decoration: underline;
    cursor: pointer;
    word-break: break-all;
`;
        container.appendChild(nameLabel);
        chatBox.appendChild(container);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    // ★ chatBoxが「ドロップ受付中」であることを明示する
    chatBox.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        chatBox.style.backgroundColor = "rgba(0,132,255,0.1)"; // ドラッグ中に色を変えると「ここだ！」ってわかります
    });
    chatBox.addEventListener("dragleave", () => {
        chatBox.style.backgroundColor = ""; // 背景をクリア
    });
    // 3. ドロップした時（ファイルを処理して、色も戻す）
    chatBox.addEventListener("drop", async (e) => {
        e.preventDefault();
        chatBox.style.backgroundColor = ""; // ★ドロップ完了時も元に戻す
        const files = e.dataTransfer?.files;
        if (!files || files.length === 0)
            return;
        const file = files[0];
        let subType = "file";
        if (file.type.startsWith("image/"))
            subType = "image";
        if (file.type.startsWith("audio/"))
            subType = "audio";
        if (file.type.startsWith("video/"))
            subType = "image";
        await processFileAndSend(file, subType);
    });
    async function handleFileSelect(event, subType) {
        const target = event.target;
        const file = target.files?.[0];
        if (!file)
            return;
        await processFileAndSend(file, subType);
        target.value = ""; // 入力をリセット
    }
    // --- 2. 送信司令塔（originalNameを送信に含める） ---
    // ★ 新しく作る：ファイルを受け取って送信するだけの「心臓部」
    async function processFileAndSend(file, subType) {
        if (!aesKeyhash) {
            addSystemMsg("鍵がまだ交換されていません。相手が参加するまでお待ちください。");
            return;
        }
        // 物理班の安全装置
        const MAX_SIZE = 15 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            addSystemMsg(`⚠️ サイズ超過: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
            return;
        }
        let finalSubType = subType;
        if (file.type.startsWith('audio/'))
            finalSubType = "audio";
        // 動画の場合、subTypeをimageにしておくとaddMediaBubbleでvideoタグが作られやすい
        if (file.type.startsWith('video/'))
            finalSubType = "image";
        const extension = file.name.split('.').pop();
        const uuidName = `${crypto.randomUUID()}.${extension}`;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const plaintext = new Uint8Array(arrayBuffer);
            const encrypted = await encrypt(aesKeyhash, plaintext);
            const [ivB64, dataB64] = await Promise.all([
                arrayBufferToBase64(encrypted.iv),
                arrayBufferToBase64(encrypted.data)
            ]);
            const msg = {
                type: "message",
                subType: finalSubType,
                mimeType: file.type,
                fileName: uuidName,
                originalName: file.name,
                room: room,
                name: name,
                uuid: storedUuid,
                iv: ivB64,
                data: dataB64,
            };
            wss.send(JSON.stringify(msg));
            const url = URL.createObjectURL(new Blob([plaintext], { type: file.type }));
            addMediaBubble(url, uuidName, file.name, true, finalSubType);
        }
        catch (e) {
            console.error("送信エラー:", e);
        }
    }
    // --- 3. UIの設置（inputContainerへの追加） ---
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    const fileBtn = document.createElement("button");
    fileBtn.textContent = "＋";
    fileBtn.style.cssText = "background: none; border: none; font-size: 20px; cursor: pointer; padding: 5px;";
    fileBtn.onclick = () => fileInput.click();
    inputContainer.prepend(fileBtn);
    fileInput.onchange = (e) => handleFileSelect(e, "file");
    // 1. 中央配置用のコンテナを作る
    const pinContainer = document.createElement("div");
    pinContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    background: white;
    padding: 30px;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 2000;
    width: 80%;
    max-width: 300px;
`;
    // 2. PIN入力欄（大きくする）
    const pininput = document.createElement("input");
    pininput.type = "password";
    pininput.placeholder = "PIN(数字)";
    pininput.inputMode = "numeric"; // スマホで数字キーボードを出す
    pininput.style.cssText = `
    width: 100%;
    padding: 12px;
    font-size: 18px;
    text-align: center;
    border-radius: 8px;
    border: 2px solid #ddd;
    outline: none;
`;
    // 3. 鍵復元ボタン（大きく、かっこよく）
    const pinbtn = document.createElement("button");
    pinbtn.textContent = "鍵を復元してチャット開始";
    pinbtn.style.cssText = `
    width: 100%;
    padding: 15px;
    font-size: 16px;
    border-radius: 8px;
    border: none;
    background: #0084ff;
    color: white;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,132,255,0.3);
`;
    // 4. 緊急削除ボタン（ついでに下に小さく配置）
    const wipeLink = document.createElement("span");
    wipeLink.textContent = "データをすべて破棄";
    wipeLink.style.cssText = "color: #ff4d4d; cursor: pointer; font-size: 12px; text-decoration: underline; margin-top: 10px;";
    wipeLink.onclick = emergencyWipe; // さっきの関数を紐付け
    // まとめて画面に追加
    pinContainer.appendChild(pininput);
    pinContainer.appendChild(pinbtn);
    pinContainer.appendChild(wipeLink);
    document.body.appendChild(pinContainer);
    const enemyencyWipeBtn = document.createElement("button");
    enemyencyWipeBtn.textContent = "データ削除";
    enemyencyWipeBtn.style.cssText = "position: fixed; top: 10px; left: 10px; padding: 8px 12px; border-radius: 8px; border: none; background: #ff4444; color: white; font-weight: bold; cursor: pointer; z-index: 1000;";
    document.body.appendChild(enemyencyWipeBtn);
    enemyencyWipeBtn.addEventListener("click", async () => {
        await emergencyWipe();
    });
    // 鍵が復元されたらこのコンテナを消す処理を restoreKey の成功時に入れてね
    // pinContainer.style.display = "none";
    async function emergencyWipe() {
        if (!confirm("鍵データをすべて破棄し、ローカル情報も削除しますか？"))
            return;
        console.log("🛠️ 緊急ワイプを実行します...");
        // 1. DBの鍵データをすべて空にする（UUIDだけ残す）
        const { error } = await supabase
            .from('profile_users')
            .update({
            ed25519_pub: null,
            x25519_pub: null,
            ed25519_private: null,
            salt: null,
            iv: null
        })
            .eq('uuid', storedUuid);
        if (error) {
            console.error("❌ DBのワイプに失敗しました:", error.message);
            alert("DBの削除に失敗しました。ネットワークを確認してください。");
            return;
        }
        // 2. ローカルストレージを完全に空にする
        // これで PIN や UUID、トークンなどがすべて消えます
        localStorage.clear();
        sessionStorage.clear();
        console.log("✅ 全データの破棄が完了しました。");
        alert("すべての鍵とローカルデータを削除しました。");
        // 3. 画面をリロードして初期状態（ログイン前）に戻す
        location.reload();
    }
    async function sendEncryptedMessage(text, aeskey) {
        if (!aeskey) {
            console.error("エラー: AES鍵がまだ生成されていません。相手が接続するまで待ってください。");
            addSystemMsg("鍵がまだ交換されていません。相手が参加するまでお待ちください。");
            return;
        }
        try {
            const encoder = new TextEncoder();
            const plaintext = encoder.encode(text);
            const encrypted = await encrypt(aeskey, plaintext);
            // ★並列で高速変換
            const [ivB64, dataB64] = await Promise.all([
                arrayBufferToBase64(encrypted.iv),
                arrayBufferToBase64(encrypted.data)
            ]);
            const msg = {
                type: "message",
                room: room,
                name: name,
                uuid: storedUuid,
                iv: ivB64,
                data: dataB64,
            };
            wss.send(JSON.stringify(msg));
            console.log(`%c[送信完了]: ${text}`, "color: #00bfff; font-weight: bold;");
            addBubble(text, true);
        }
        catch (e) {
            console.error("送信時の暗号化に失敗しました:", e);
        }
    }
    function addBubble(text, isMe) {
        const bubble = document.createElement("div");
        const M = isMe;
        // スタイル設定（既存のものを継承）
        bubble.style.cssText = `
        max-width: 70%; 
        padding: 8px 15px; 
        border-radius: 18px; 
        font-size: 15px; 
        align-self: ${M ? "flex-end" : "flex-start"}; 
        background-color: ${M ? "#0084ff" : "#e4e6eb"}; 
        color: ${M ? "white" : "#050505"}; 
        ${M ? "border-bottom-right-radius: 4px;" : "border-bottom-left-radius: 4px;"};
        word-break: break-all;
        white-space: pre-wrap;
    `;
        // --- http と https の両方に対応するリンク化ロジック ---
        const urlRegex = /(https?:\/\/[^\s]+)/g; // s? なので http:// も https:// もOK
        const parts = text.split(urlRegex);
        parts.forEach(part => {
            if (part.match(urlRegex)) {
                const link = document.createElement("a");
                link.href = part;
                link.textContent = part;
                link.target = "_blank"; // LINE内ブラウザなどで開くときに便利
                link.rel = "noopener noreferrer";
                link.style.color = M ? "#fff" : "#0084ff"; // 背景色に合わせて調整
                link.style.textDecoration = "underline";
                bubble.appendChild(link);
            }
            else {
                // 普通のテキスト部分
                bubble.appendChild(document.createTextNode(part));
            }
        });
        chatBox.appendChild(bubble);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    function addSystemMsg(msg) {
        const p = document.createElement("div");
        p.textContent = msg;
        p.style.cssText = "text-align: center; color: #888; font-size: 12px; margin: 10px;";
        chatBox.appendChild(p);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    async function fetchMySecurityData() {
        const { data, error } = await supabase
            .from('profile_users')
            .select('ed25519_private, salt, iv')
            .eq('uuid', storedUuid)
            .maybeSingle();
        if (error || !data) {
            console.error("データが取れんかった...", error);
            return null;
        }
        return data;
    }
    async function testEd25519Signature(privateKey, publicKey) {
        const encoder = new TextEncoder();
        // 1. 署名したいメッセージをバイナリ（Uint8Array）に変換
        const message = "マイン・プロトコル、テスト送信開始！車⭐︎";
        const data = encoder.encode(message);
        console.log("📝 署名中...");
        // 2. 署名実行（Ed25519）
        const signature = await window.crypto.subtle.sign({
            name: "Ed25519"
        }, privateKey, data);
        // 署名結果は64バイトのバイナリ
        const sigHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        console.log("✅ 署名完了（64バイトHex）:", sigHex);
        // 3. 検証実行
        console.log("🔍 検証中...");
        const isValid = await window.crypto.subtle.verify({
            name: "Ed25519"
        }, publicKey, signature, data);
        if (isValid) {
            console.log("🚀 検証成功！このメッセージは正真正銘、マインさんの鍵で署名されています。");
        }
        else {
            console.error("❌ 検証失敗... 鍵かデータが一致していません。");
        }
    }
    // 実験：相手のUUID（画像にあった d1fde...）を使って、公開鍵だけを引っこ抜く
    async function restoreKey(pin) {
        // 1. DBからデータを取得
        const dbData = await fetchMySecurityData();
        // --- 【新規登録ルート】DBにデータがない場合 ---
        if (!dbData || dbData.salt === null) {
            console.log("欄はあるけど中身が空だね。今から鍵を作って登録するよ！");
            const salt = generateSalt();
            const masterSeed = generateMasterSeed(32);
            const aesKey = await deriveKeyFromPin(pin.toString(), salt);
            const encrypted = await encrypt(aesKey, masterSeed.buffer);
            const ivB64 = await arrayBufferToBase64(encrypted.iv);
            const encryptedSeed = await arrayBufferToBase64(encrypted.data);
            // RSA(またはEd25519)鍵ペアを生成
            const { privateKey, publicKey } = await generateEd25519KeyPair(new Uint8Array(masterSeed));
            const { privateKey: xPriv, publicKey: xPub } = await generateX25519KeyPair(new Uint8Array(masterSeed));
            console.log("今からDBを更新します... UUID:", storedUuid);
            // restoreKey 内の保存処理をこう書き換える
            console.log("🛠️ 既存の自分を更新します... UUID:", storedUuid);
            const { data, error, status } = await supabase
                .from('profile_users')
                .update({
                ed25519_pub: await arrayBufferToBase64(await crypto.subtle.exportKey("raw", publicKey)),
                ed25519_private: encryptedSeed,
                salt: await arrayBufferToBase64(salt),
                iv: ivB64,
                x25519_pub: await arrayBufferToBase64(await crypto.subtle.exportKey("raw", xPub))
            })
                .eq('uuid', storedUuid) // 自分のUUIDに一致する行だけ
                .select();
            // 「なかったら降りる」判定
            if (error) {
                console.error("❌ 通信エラーで降りるよ:", error.message);
                return;
            }
            if (!data || data.length === 0) {
                console.error("🚨 DBに自分の行がない！不正なアクセスか、登録が漏れてるからここで降りるよ！");
                return; // 勝手に作らずに終了
            }
            console.log("✅ 正しく自分を更新できた。出発進行！");
            return {
                privateKey,
                publicKey
            }; // ここで新規登録時は終了
        }
        // --- 【復元ルート】DBにデータがある場合 ---
        console.log("DBから鍵を復元中...");
        try {
            const salt = await base64ToUint8Array(dbData.salt);
            const iv = await base64ToUint8Array(dbData.iv);
            const encryptedSeed = await base64ToUint8Array(dbData.ed25519_private);
            const aesKey = await deriveKeyFromPin(pin, salt);
            const decryptedBuffer = await crypto.subtle.decrypt({
                name: "AES-GCM",
                iv: iv.buffer
            }, aesKey, encryptedSeed.buffer);
            const seed = new Uint8Array(decryptedBuffer);
            const { privateKey, publicKey } = await generateEd25519KeyPair(seed);
            const { privateKey: xPriv, publicKey: xPub } = await generateX25519KeyPair(seed);
            console.log("✨ 復元成功！これで署名ができるようになったぞ。");
            return {
                privateKey,
                publicKey,
                xPriv,
                xPub
            };
        }
        catch (e) {
            console.error("❌ 復元失敗。PINコードが違うか、データが壊れています:", e);
            throw e;
        }
    }
    const name = localStorage.getItem("my_name") ?? "不明なユーザー";
    const storedToken = localStorage.getItem("my_token") ?? "";
    const storedUuid = localStorage.getItem("my_uuid") ?? "";
    const wss = new WebSocket("wss://mail.shudo-physics.com/");
    let room;
    let aeskey = null;
    let pin;
    const salt = generateSalt();
    const base64salt = await arrayBufferToBase64(salt);
    let keys;
    let rand = crypto.getRandomValues(new Uint8Array(32));
    const dhSentHistory = new Map();
    // DB用のパスワードとなんか、　まぁええやろ
    const supabase = createClient('https://cedpfdoanarzyxcroymc.supabase.co', 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i', {
        global: {
            headers: {
                Authorization: `Bearer ${storedToken}`,
            },
        },
    });
    let aesKeyhash;
    if (storedToken === "") {
        window.location.href = "../index.html";
        return;
    }
    sendBtn.addEventListener("click", async () => {
        if (input.value) {
            await sendEncryptedMessage(input.value, aesKeyhash);
            input.value = "";
        }
    });
    input.addEventListener("keypress", async (e) => {
        if (e.key === "Enter" && input.value) {
            await sendEncryptedMessage(input.value, aesKeyhash);
            input.value = "";
        }
    });
    window.addEventListener("beforeunload", () => {
        if (wss && wss.readyState === WebSocket.OPEN) {
            wss.send(JSON.stringify({
                type: "leave",
                room: room,
                name: name,
                uuid: storedUuid
            }));
        }
    });
    btnroom.addEventListener("click", () => {
        room = inputroom.value || "defaultroom";
        chatHeader.textContent = `Room: ${room}`;
        roomSelection.style.display = "none";
        chatContainer.style.display = "flex";
        // --- ここが重要！ ---
        const joinMsg = JSON.stringify({
            type: "join",
            room: room,
            name: name,
            uuid: storedUuid,
            token: storedToken
        });
        // まだ接続中なら onopen を待つ
        wss.onopen = () => {
            console.log("🚀 Connection opened, sending JOIN");
            wss.send(joinMsg);
        };
        // すでに接続済み（OPEN）なら、その場ですぐ送る！
        if (wss.readyState === WebSocket.OPEN) {
            console.log("⚡ Already open, sending JOIN immediately");
            wss.send(joinMsg);
        }
        wss.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log("受信メッセージ:", data);
            if (data.type === "join-ack")
                addSystemMsg("参加しました");
            if (data.type === "join-nack")
                addSystemMsg("エラー: ルームに参加できませんでした");
            if (data.type === "quit-broadcast" || data.type === "leave" || data.type === "leave-broadcast") {
                addSystemMsg((data.name ? data.name.substring(0, 8) : "誰か") + "が退出しました");
                aesKeyhash = null; // 鍵をリセット
                aeskey = null;
            }
            if (data.type === "join-broadcast") {
                addSystemMsg(data.name.substring(0, 8) + "が参加しました");
            }
            if (data.type === "dh-start" || data.type === "join-broadcast") {
                if (data.name === name)
                    return;
                // ★追加：直近1秒以内に、この相手(uuid)に鍵を送っていたら無視する
                const targetUuid = data.uuid; // 相手のUUIDが入っていると仮定
                const now = Date.now();
                const lastSent = dhSentHistory.get(targetUuid) || 0;
                // 1000ミリ秒(1秒)未満の連投ならスキップ
                if (now - lastSent < 1000) {
                    console.log(`⚠️ ${data.type} 重複のため無視しました`);
                    return;
                }
                const dhmsg = dhs(event, name, room, storedUuid, rand);
                if (dhmsg) {
                    wss.send(JSON.stringify(dhmsg));
                    console.log("自分のDHを送信完了");
                    // ★追加：送信時刻をメモする
                    dhSentHistory.set(targetUuid, now);
                }
            }
            else if (data.type === "DH" && data.name !== name) {
                try {
                    // ★awaitを追加
                    const keys = await restoreKey(localStorage.getItem("pin") || "");
                    // 1. まずViewから相手のプロフィールを取得
                    const peerData = await testPublicKeyFetch(data.uuid);
                    if (peerData && peerData.x25519_pub) {
                        // 2. その中の「x25519_pub」という文字列だけをバイナリ（Uint8Array）に変換
                        const peerRawPubKey = await base64ToUint8Array(peerData.x25519_pub);
                        // 3. インポートして鍵オブジェクトにする（これがさっきの「儀式」）
                        const theirPublicKey = await window.crypto.subtle.importKey("raw", peerRawPubKey, {
                            name: "X25519"
                        }, true, []);
                        // 4. これでようやく「合体」！
                        aeskey = await deriveSharedKey(keys.xPriv, theirPublicKey);
                        console.log("✨ 共通鍵の合体に成功！");
                    }
                    console.log("✨✨ AES鍵が完成しました！");
                    console.log("AES鍵 base64:", await arrayBufferToBase64(await crypto.subtle.exportKey("raw", aeskey)));
                    const aes = await aesKeyToArray(aeskey);
                    console.log("AES鍵 Uint8Array:", aes);
                    const peerRand = new Uint8Array(Object.values(data.rand));
                    const myUuid = storedUuid;
                    const peerUuid = data.uuid;
                    // UUIDを比較して、順番を常に一定にする（アルファベット順など）
                    let firstRand, secondRand;
                    if (myUuid < peerUuid) {
                        firstRand = rand; // 自分が先
                        secondRand = peerRand; // 相手が後
                    }
                    else {
                        firstRand = peerRand; // 相手が先
                        secondRand = rand; // 自分が後
                    }
                    aesKeyhash = await deriveAesKeySafe(await sha256(await sha512(combine(await sha512(combine(await sha512(firstRand), await sha512(secondRand))), await sha512(aes)))));
                    console.log(" AES鍵ハッシュが完成しました！");
                }
                catch (e) {
                    console.error("鍵交換エラー:", e);
                }
                console.log("🔑 鍵交換プロセス完了");
                addSystemMsg("メッセージを送信できます");
                // wss.onmessage の中の data.type === "message" の部分
            }
            else if (data.type === "message" && data.name !== name) {
                try {
                    if (!aesKeyhash)
                        return;
                    const [iv, encryptedContent] = await Promise.all([
                        base64ToUint8Array(data.iv),
                        base64ToUint8Array(data.data)
                    ]);
                    const decryptedBuffer = await decrypt(aesKeyhash, iv, encryptedContent.buffer);
                    // ★修正1：データを確実にコピーしてバイナリとして安定させる
                    const cleanData = new Uint8Array(decryptedBuffer);
                    if (data.subType === "image" || data.subType === "file" || data.subType === "audio") {
                        // ★修正2：MIMEタイプを動的に判定
                        // 届いた data.mimeType を優先し、なければ拡張子から推測
                        let mime = data.mimeType;
                        if (!mime) {
                            if (data.fileName.toLowerCase().endsWith(".jpg") || data.fileName.toLowerCase().endsWith(".jpeg")) {
                                mime = "image/jpeg";
                            }
                            else if (data.fileName.toLowerCase().endsWith(".png")) {
                                mime = "image/png";
                            }
                            else if (data.subType === "image") {
                                mime = "image/jpeg"; // デフォルト
                            }
                            else {
                                mime = "application/octet-stream";
                            }
                        }
                        const blob = new Blob([cleanData], {
                            type: mime
                        });
                        const url = URL.createObjectURL(blob);
                        console.log(`[成功] 表示中: ${data.originalName} (MIME: ${mime})`);
                        // 表示の床へ
                        addMediaBubble(url, data.fileName, data.originalName, false, data.subType);
                    }
                    else {
                        const messageText = new TextDecoder().decode(cleanData);
                        addBubble(messageText, false);
                    }
                }
                catch (e) {
                    console.error("復号・表示に失敗しました:", e);
                }
            }
        };
    });
    if (localStorage.getItem("pin") === null || localStorage.getItem("pin") === "") {
        enemyencyWipeBtn.style.display = "none";
        roomSelection.style.display = "none";
        pininput.addEventListener('input', () => {
            // 数字以外（^0-9）をすべて空文字に置換
            pininput.value = pininput.value.replace(/[^0-9]/g, '');
        });
        pinbtn.addEventListener("click", async () => {
            pinContainer.style.display = "none";
            enemyencyWipeBtn.style.display = "flex";
            keys = await restoreKey(pininput.value);
            const keys2 = await restoreKey(pininput.value); // 再度復元して同じ鍵が出るか確認
            // 中身（Rawデータ）を取り出して比較する例
            const raw1 = await crypto.subtle.exportKey("raw", keys.publicKey);
            const raw2 = await crypto.subtle.exportKey("raw", keys2.publicKey);
            const isSame = new Uint8Array(raw1).every((val, i) => val === new Uint8Array(raw2)[i]);
            console.log("🔑 鍵の中身の一致確認:", isSame); // これなら true になるはず！
            testEd25519Signature(keys.privateKey, keys.publicKey);
            testPublicKeyFetch("652c0ecd-c52b-4d12-a9ce-ea5a94b33f8e");
            localStorage.setItem("pin", pininput.value);
            roomSelection.style.display = "flex";
        });
    }
    else {
        pinContainer.style.display = "none";
        enemyencyWipeBtn.style.display = "flex";
        testPublicKeyFetch("652c0ecd-c52b-4d12-a9ce-ea5a94b33f8e");
    }
}
main();
