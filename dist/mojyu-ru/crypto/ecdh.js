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
    // 1. 秘密鍵をインポート（用途は sign のみ）
    const privateKey = await window.crypto.subtle.importKey("raw", seed, { name: "Ed25519" }, true, ["sign"] // ここを ["sign", "verify"] にするとエラーになります
    );
    // 2. 公開鍵を導出（秘密鍵から生の公開鍵を取り出す）
    // ※Ed25519なら秘密鍵オブジェクトから直接エクスポートできます
    const publicKeyBuffer = await window.crypto.subtle.exportKey("raw", privateKey);
    // 3. 公開鍵を検証用オブジェクトとして再インポート（用途は verify のみ）
    const publicKey = await window.crypto.subtle.importKey("raw", publicKeyBuffer, { name: "Ed25519" }, true, ["verify"]);
    return { privateKey, publicKey };
}
