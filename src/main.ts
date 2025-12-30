//npx vite build
import {
    generateKeyPair,
    deriveSharedSecret,
    generateEd25519KeyPair,
    generateX25519KeyPair
} from "./mojyu-ru/crypto/ecdh.js";
import {
    bufferToHex,
    arrayBufferToBase64,
    base64ToUint8Array
} from "./mojyu-ru/base64.js"; // 16進数変換のみ残す
import {
    generateSalt,
    combineSalts,
    generateMasterSeed
} from "./mojyu-ru/crypto/saltaes.js";
import {
    handleDHMessage
} from "./mojyu-ru/dh.js";
import {
    dhs
} from "./mojyu-ru/joins.js";
import {
    deriveAesKeySafe
} from "./mojyu-ru/crypto/kdf.js";
import {
    decrypt,
    encrypt,
    deriveKeyFromPin,
    deriveSharedKey
} from "./mojyu-ru/crypto/aes.js";
// @supabase/supabase-js ではなく、URLを直接指定する
// @ts-ignore
import {
    createClient
    // @ts-ignore
} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
// @ts-ignore
import {
    ed25519,
    x25519
    // @ts-ignore
} from 'https://esm.sh/@noble/curves@1.3.0/ed25519';
// 1. Supabaseの接続設定

// 32バイトのシード（本来はPINから生成）
async function main() {

      const restoreKeys = await restoreKey(localStorage.getItem("pin") || "");
    const name: string = localStorage.getItem("my_name") ?? "不明なユーザー";
    const storedToken = localStorage.getItem("my_token") ?? "";
    const storedUuid = localStorage.getItem("my_uuid") ?? "";
    const wss: WebSocket = new WebSocket("wss://mail.shudo-physics.com/");
    let room: string;
    let aeskey: CryptoKey | null = null;
    let anoskey: CryptoKey;

    // DB用のパスワードとなんか、　まぁええやろ
    const supabase = createClient(
        'https://cedpfdoanarzyxcroymc.supabase.co',
        'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i', {
            global: {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                },
            },
        }
    );

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
    // 実験
    // 入力欄 (真ん中)

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
    if (!confirm("鍵データをすべて破棄し、ローカル情報も削除しますか？")) return;

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



    async function sendEncryptedMessage(text: string, aeskey: CryptoKey) {
        if (!aeskey) {
            console.error("エラー: AES鍵がまだ生成されていません。相手が接続するまで待ってください。");
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
            const sig = await ed25519Handler(1, restoreKeys.privateKey, dataB64);

            const msg = {
                type: "message",
                room: room,
                name: name,
                uuid: storedUuid,
                iv: ivB64,
                data: dataB64,
                sig : sig
            };
            wss.send(JSON.stringify(msg));
            console.log(`%c[送信完了]: ${text}`, "color: #00bfff; font-weight: bold;");
            addBubble(text, true);
        } catch (e) {
            console.error("送信時の暗号化に失敗しました:", e);
        }
    }

    function addBubble(text: string, isMe: boolean) {
        const bubble = document.createElement("div");
        const M: boolean = isMe;
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
            overflow-wrap: break-word;
            white-space: pre-wrap;
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

    async function fetchMySecurityData() {
        const {
            data,
            error
        } = await supabase
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


    async function ed25519Handler(mode, key, dataB64, sigB64 = "") {
    const encoder = new TextEncoder();
    const dataUint8 = encoder.encode(dataB64);

    if (mode === 1) {
        // --- モード1: 署名作成 ---
        const signature = await window.crypto.subtle.sign(
            { name: "Ed25519" },
            key, // ed25519_private
            dataUint8
        );
        return await arrayBufferToBase64(signature);

    } else if (mode === 2) {
        // --- モード2: 署名検証 ---
        const sigUint8 = await base64ToUint8Array(sigB64);
        const isValid = await window.crypto.subtle.verify(
            { name: "Ed25519" },
            key, // ed25519_pub
            sigUint8 as BufferSource,
            dataUint8
        );
        return isValid; // true か false を返す
    }
}


    async function testEd25519Signature(privateKey: CryptoKey, publicKey: CryptoKey) {
        const encoder = new TextEncoder();

        // 1. 署名したいメッセージをバイナリ（Uint8Array）に変換
        const message = "マイン・プロトコル、テスト送信開始！車⭐︎";
        const data = encoder.encode(message);

        console.log("📝 署名中...");

        // 2. 署名実行（Ed25519）
        const signature = await window.crypto.subtle.sign({
                name: "Ed25519"
            },
            privateKey,
            data
        );

        // 署名結果は64バイトのバイナリ
        const sigHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        console.log("✅ 署名完了（64バイトHex）:", sigHex);

        // 3. 検証実行
        console.log("🔍 検証中...");
        const isValid = await window.crypto.subtle.verify({
                name: "Ed25519"
            },
            publicKey,
            signature,
            data
        );

        if (isValid) {
            console.log("🚀 検証成功！このメッセージは正真正銘、マインさんの鍵で署名されています。");
        } else {
            console.error("❌ 検証失敗... 鍵かデータが一致していません。");
        }
    }
    // 実験：相手のUUID（画像にあった d1fde...）を使って、公開鍵だけを引っこ抜く
    async function testPublicKeyFetch(targetUuid: string): Promise < any > {
        console.log("🛠️ 実験開始: 窓口(View)からデータ取得を試みます...");

        const {
            data,
            error
        } = await supabase
        .from('public_profiles') // 👈 さっき作った View の名前
        .select('*') // 👈 あえて「全部」リクエストしてみる
        .eq('uuid', targetUuid)
        .maybeSingle();

        if (error) {
            console.error("❌ 失敗:", error.message);
            return null;
        }

        console.log("🎯 取得できたデータ:", data);

        // 検証
        if (data && data.email === undefined && data.ed25519_private === undefined) {
            console.log("✅ 成功！メルアドと秘密鍵は物理的に遮断されています。");
        } else if (data) {
            console.warn("⚠️ 警告: 隠すべきデータが見えてしまっています！");
        }

        return data;
    }


    async function restoreKey(pin: string) {
        // 1. DBからデータを取得
        const dbData = await fetchMySecurityData() as any;

        // --- 【新規登録ルート】DBにデータがない場合 ---
        if (!dbData || dbData.salt === null) {
            console.log("欄はあるけど中身が空だね。今から鍵を作って登録するよ！");
            const salt: Uint8Array = generateSalt();
            const masterSeed = generateMasterSeed(32);
            const aesKey = await deriveKeyFromPin(pin.toString(), salt);
            const encrypted = await encrypt(aesKey, masterSeed.buffer as ArrayBuffer);

            const ivB64 = await arrayBufferToBase64(encrypted.iv);
            const encryptedSeed = await arrayBufferToBase64(encrypted.data);

            // RSA(またはEd25519)鍵ペアを生成
            const {
                privateKey,
                publicKey
            } = await generateEd25519KeyPair(new Uint8Array(masterSeed));
            const {
                privateKey: xPriv,
                publicKey: xPub
            } = await generateX25519KeyPair(new Uint8Array(masterSeed));

            console.log("今からDBを更新します... UUID:", storedUuid);
            // restoreKey 内の保存処理をこう書き換える
            console.log("🛠️ 既存の自分を更新します... UUID:", storedUuid);

            const {
                data,
                error,
                status
            } = await supabase
                .from('profile_users')
                .update({ // upsert ではなく update
                    ed25519_pub: await arrayBufferToBase64(
                        await crypto.subtle.exportKey("raw", publicKey)
                    ),
                    ed25519_private: encryptedSeed,
                    salt: await arrayBufferToBase64(salt),
                    iv: ivB64,
                    x25519_pub: await arrayBufferToBase64(
                        await crypto.subtle.exportKey("raw", xPub)
                    )
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
                    iv: iv.buffer as ArrayBuffer
                },
                aesKey,
                encryptedSeed.buffer as ArrayBuffer
            );
            const seed = new Uint8Array(decryptedBuffer);

            const {
                privateKey,
                publicKey
            } = await generateEd25519KeyPair(seed);
            const {
                privateKey: xPriv,
                publicKey: xPub
            } = await generateX25519KeyPair(seed);

            console.log("✨ 復元成功！これで署名ができるようになったぞ。");
            return {
                privateKey,
                publicKey,
                xPriv,
                xPub
            };
        } catch (e) {
            console.error("❌ 復元失敗。PINコードが違うか、データが壊れています:", e);
            throw e;
        }
    }



    if (storedToken === "") {
        window.location.href = "../index.html";
        return;
    }

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

        wss.onmessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            console.log("受信メッセージ:", data);

            if (data.type === "join-ack") addSystemMsg("参加しました");
            if (data.type === "join-nack") addSystemMsg("エラー: ルームに参加できませんでした");
            if (data.type === "quit-broadcast" || data.type === "leave" || data.type === "leave-broadcast") {
                addSystemMsg((data.name ? data.name.substring(0, 8) : "誰か") + "が退出しました");
            }
            if (data.type === "join-broadcast") {
                addSystemMsg(data.name.substring(0, 8) + "が参加しました");
            }

            if (data.type === "dh-start" || data.type === "join-broadcast") {
                if (data.name === name) return;
                const dhmsg = dhs(event, name, room, storedUuid);
                if (dhmsg) {
                    wss.send(JSON.stringify(dhmsg));
                    console.log("自分のDHを送信完了");
                }
            } else if (data.type === "DH" && data.name !== name) {
                try {
                    // ★awaitを追加
                    const keys = await restoreKey(localStorage.getItem("pin") || "");
                    // 1. まずViewから相手のプロフィールを取得
                    const peerData = await testPublicKeyFetch(data.uuid);

                    if (peerData && peerData.x25519_pub) {
                        // 2. その中の「x25519_pub」という文字列だけをバイナリ（Uint8Array）に変換
                        const peerRawPubKey = await base64ToUint8Array(peerData.x25519_pub);

                        // 3. インポートして鍵オブジェクトにする（これがさっきの「儀式」）
                        const theirPublicKey = await window.crypto.subtle.importKey(
                            "raw",
                            peerRawPubKey as BufferSource, {
                                name: "X25519"
                            },
                            true,
                            []
                        );
                        anoskey = theirPublicKey;
                        // 4. これでようやく「合体」！
                        aeskey = await deriveSharedKey(keys.xPriv, theirPublicKey);
                        console.log("✨ 共通鍵の合体に成功！");
                    }

                    console.log("✨✨ AES鍵が完成しました！");
                    console.log("AES鍵 base64:", await arrayBufferToBase64(await crypto.subtle.exportKey("raw", aeskey)));
                } catch (e) {
                    console.error("鍵交換エラー:", e);
                }
            } else if (data.type === "message" && data.name !== name) {
                try {
                    if (!aeskey) return;
                    // ★await + Promise.all で高速デコード
                    const [iv, encryptedContent] = await Promise.all([
                        base64ToUint8Array(data.iv),
                        base64ToUint8Array(data.data)
                    ]);
                    const sig = await ed25519Handler(2, anoskey, data.sig);
                    console.log("署名検証結果:", sig);
                    if (sig === false) {
                        console.error("署名検証失敗");
                        return;
                    }
                    const decryptedArray = await decrypt(aeskey, iv, encryptedContent.buffer as ArrayBuffer);
                    const messageText = new TextDecoder().decode(decryptedArray);
                    addBubble(messageText, false);
                } catch (e) {
                    console.error("復号失敗:", e);
                }
            }
        };
    });

    

    if (localStorage.getItem("pin") === null) {
      enemyencyWipeBtn.style.display = "none";
        roomSelection.style.display = "none";
        pininput.addEventListener('input', () => {
            // 数字以外（^0-9）をすべて空文字に置換
            pininput.value = pininput.value.replace(/[^0-9]/g, '');
        });

        pinbtn.addEventListener("click", async () => {
          pinContainer.style.display = "none";
          enemyencyWipeBtn.style.display = "flex";

            const keys = await restoreKey(pininput.value);
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

    } else {
        pinContainer.style.display = "none";
      enemyencyWipeBtn.style.display = "flex";
        const keys = await restoreKey(localStorage.getItem("pin") || "");
        const keys2 = await restoreKey(localStorage.getItem("pin") || ""); // 再度復元して同じ鍵が出るか確認
        // 中身（Rawデータ）を取り出して比較する例
        const raw1 = await crypto.subtle.exportKey("raw", keys.publicKey);
        const raw2 = await crypto.subtle.exportKey("raw", keys2.publicKey);

        const isSame = new Uint8Array(raw1).every((val, i) => val === new Uint8Array(raw2)[i]);
        console.log("🔑 鍵の中身の一致確認:", isSame); // これなら true になるはず！
        testEd25519Signature(keys.privateKey, keys.publicKey);
        testPublicKeyFetch("652c0ecd-c52b-4d12-a9ce-ea5a94b33f8e");
        localStorage.setItem("pin", pininput.value);

    }

}

// 先ほどのログで出ていた CryptoKey を使って実行
// testEd25519Signature(yourPrivateKey, yourPublicKey);
main();