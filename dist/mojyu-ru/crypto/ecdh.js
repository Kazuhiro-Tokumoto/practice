export async function generateKeyPair() {
    return crypto.subtle.generateKey({
        name: "ECDH",
        namedCurve: "P-256"
    }, false, ["deriveBits"]);
}
// mojyu-ru/crypto/ecdh.ts
/**
 * 相手のJWK公開鍵と自分の秘密鍵から共有秘密(Shared Secret)を導出する
 */
export async function deriveSharedSecret(myPrivateKey, remoteJwk) {
    // 1. 相手のJWKをCryptoKeyオブジェクトにインポート
    const remotePublicKey = await crypto.subtle.importKey("jwk", remoteJwk, {
        name: "ECDH",
        namedCurve: "P-256",
    }, true, []);
    // 2. 自分の秘密鍵と相手の公開鍵で共有秘密を生成
    return await crypto.subtle.deriveBits({
        name: "ECDH",
        public: remotePublicKey,
    }, myPrivateKey, 256 // 256ビットの共有秘密を導出
    );
}
export async function generateEd25519KeyPair(seed) {
    // 関数名はそのまま（呼び出し側を直さなくていいように）
    // 中身を RSA にすり替えます
    console.log("🚀 RSAで緊急点火します...");
    const keyPair = await window.crypto.subtle.generateKey({
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
    }, true, // 保存するために extractable は true
    ["sign", "verify"]);
    // 公開鍵を raw ではなく spki 形式で取り出す（RSAの約束）
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    return {
        privateKey: keyPair.privateKey,
        publicKey: new Uint8Array(publicKeyBuffer)
    };
}
