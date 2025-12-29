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
// ecdh.js:27 付近
export async function generateEd25519KeyPair(seed) {
    console.log("🛠️ ECDSA(P-256)に切り替えて復元します...");
    // 1. seedを「秘密鍵」としてインポート
    // ECDSAの場合、用途に "sign" を指定しても SyntaxError は出にくいです
    const privateKey = await window.crypto.subtle.importKey("raw", seed, {
        name: "ECDSA",
        namedCurve: "P-256" // 標準的な曲線
    }, true, ["sign"]);
    // 2. 秘密鍵から公開鍵データを抽出
    const pubBuffer = await window.crypto.subtle.exportKey("raw", privateKey);
    // 3. 公開鍵をインポート
    const publicKey = await window.crypto.subtle.importKey("raw", pubBuffer, {
        name: "ECDSA",
        namedCurve: "P-256"
    }, true, ["verify"]);
    return { privateKey, publicKey };
}
