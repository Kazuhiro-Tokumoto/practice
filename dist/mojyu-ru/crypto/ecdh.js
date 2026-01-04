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
    console.log("🛠️ シードから Ed25519 鍵ペアを復元します...");
    // 1. Ed25519 の秘密鍵として import するための PKCS#8 ヘッダー (32バイト用)
    // これを seed の前につけることで、Web Crypto が「これは Ed25519 の秘密鍵だ」と認識できます
    const pkcs8Header = new Uint8Array([
        0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20
    ]);
    const pkcs8Key = new Uint8Array(pkcs8Header.length + seed.length);
    pkcs8Key.set(pkcs8Header);
    pkcs8Key.set(seed, pkcs8Header.length);
    // 2. 秘密鍵をインポート
    const privateKey = await window.crypto.subtle.importKey("pkcs8", pkcs8Key, { name: "Ed25519" }, true, ["sign"]);
    // 3. 秘密鍵から公開鍵を導出するために、一度エクスポート（または署名検証用として利用）
    // Ed25519 の場合、秘密鍵があれば公開鍵は一意に決まります
    // 公開鍵を抽出するには、まず公開鍵オブジェクトを作る必要があります
    // 手順：一旦ダミー署名などで公開鍵を取り出すのではなく、
    // 秘密鍵の export 時のデータから公開鍵を生成するのが一般的ですが、
    // 最も確実なのは、一度 JWK 形式で書き出して公開鍵部分を再 import することです。
    const jwk = await window.crypto.subtle.exportKey("jwk", privateKey);
    delete jwk.d; // 秘密鍵成分を削除
    jwk.key_ops = ["verify"];
    const publicKey = await window.crypto.subtle.importKey("jwk", jwk, { name: "Ed25519" }, true, ["verify"]);
    // 4. 鍵ペアとして return する
    return { privateKey, publicKey };
}
export async function generateX25519KeyPair(seed) {
    console.log("🛠️ シードから X25519 鍵ペアを復元します...");
    // 1. X25519 用の PKCS#8 ヘッダー (32バイト用)
    // Ed25519用 (0x2b, 0x65, 0x70) ではなく、X25519用 (0x2b, 0x65, 0x6e) を使います
    const pkcs8Header = new Uint8Array([
        0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04, 0x22, 0x04, 0x20
    ]);
    const pkcs8Key = new Uint8Array(pkcs8Header.length + seed.length);
    pkcs8Key.set(pkcs8Header);
    pkcs8Key.set(seed, pkcs8Header.length);
    // 2. 秘密鍵をインポート (用途は deriveKey または deriveBits)
    const privateKey = await window.crypto.subtle.importKey("pkcs8", pkcs8Key, { name: "X25519" }, true, ["deriveKey", "deriveBits"]);
    // 3. 秘密鍵から公開鍵を導出 (JWK経由)
    const jwk = await window.crypto.subtle.exportKey("jwk", privateKey);
    delete jwk.d; // 秘密部分を削除
    jwk.key_ops = []; // X25519公開鍵のopsは空にするのが一般的
    const publicKey = await window.crypto.subtle.importKey("jwk", jwk, { name: "X25519" }, true, [] // 公開鍵側は空の用途でインポート
    );
    return { privateKey, publicKey };
}
