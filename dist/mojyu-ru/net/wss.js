// network/chat-socket.ts
import { base64ToUint8Array } from "../base64.js";
import { combineSalts } from "../crypto/saltaes.js";
import { handleDHMessage } from "../dh.js";
import { dhs } from "../joins.js";
import { deriveAesKeySafe } from "../crypto/kdf.js";
import { decrypt } from "../crypto/aes.js";
export function startChatSocket(session, onAesKeyReady, onMessageReceived) {
    const wss = new WebSocket("wss://mail.shudo-physics.com:40000/");
    let currentAesKey = null;
    wss.onopen = () => {
        wss.send(JSON.stringify({
            type: "join",
            room: session.room,
            name: session.name
        }));
    };
    wss.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const { name, room, mykey, salt, pubJwk } = session;
        const base64salt = session.salt; // 既に用意されているもの
        if (data.type === "dh-start" || data.type === "join-broadcast") {
            if (data.name === name)
                return;
            const dhmsg = dhs(event, pubJwk, base64salt, name, room);
            if (dhmsg)
                wss.send(JSON.stringify(dhmsg));
        }
        else if (data.type === "DH" && data.name !== name) {
            try {
                const remoteSalt = base64ToUint8Array(data.salt);
                const saltall = combineSalts(salt, remoteSalt);
                const sharedSecret = await handleDHMessage(data, mykey.privateKey);
                currentAesKey = await deriveAesKeySafe(sharedSecret, new Uint8Array(saltall));
                onAesKeyReady(currentAesKey); // 外に鍵ができたことを知らせる
            }
            catch (e) {
                console.error("鍵交換失敗", e);
            }
        }
        else if (data.type === "message" && data.name !== name) {
            if (!currentAesKey)
                return;
            try {
                const iv = base64ToUint8Array(data.iv);
                const encryptedContent = base64ToUint8Array(data.data);
                const decryptedArray = await decrypt(currentAesKey, iv, encryptedContent.buffer);
                const messageText = new TextDecoder().decode(decryptedArray);
                onMessageReceived(messageText); // 復号したテキストを外に渡す
            }
            catch (e) {
                console.error("復号失敗", e);
            }
        }
    };
    return wss; // 必要なら send に使うために返す
}
