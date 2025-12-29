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
    console.log("🛠️ Ed25519を再点火。seedから鍵を完全再現します...");
    // 1. まず、seedを「秘密鍵」として読み込む
    const privateKey = await window.crypto.subtle.importKey("raw", seed, { name: "Ed25519" }, true, ["sign"]);
    // 2. ★ここがポイント：秘密鍵から「公開鍵データ」を抽出する
    // Ed25519は秘密鍵から公開鍵を計算できるので、exportKeyで取り出せます
    const pubBuffer = await window.crypto.subtle.exportKey("raw", privateKey);
    // 3. 抽出した公開鍵データを「公開鍵オブジェクト」として読み込む
    const publicKey = await window.crypto.subtle.importKey("raw", pubBuffer, { name: "Ed25519" }, true, ["verify"]);
    return { privateKey, publicKey };
}
