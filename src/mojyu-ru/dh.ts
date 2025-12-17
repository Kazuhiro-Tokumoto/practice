// dh.ts
import { deriveSharedSecret } from "./crypto/ecdh.js";

/**
 * 相手のメッセージから共有秘密を導出する
 * @param msgData JSON.parse済みのデータ
 * @param myPrivateKey 自分の秘密鍵
 */
export async function handleDHMessage(msgData: any, myPrivateKey: CryptoKey): Promise<ArrayBuffer> {
    // 相手の公開鍵(JWK)
    const remoteJwk = msgData.public_key;

    // ecdh.js の関数を呼び出す
    // (ecdh.js 側で importKey を行う設計の場合)
    const sharedSecret = await deriveSharedSecret(myPrivateKey, remoteJwk);
    
    console.log("導出成功:", new Uint8Array(sharedSecret));
    return sharedSecret;
}