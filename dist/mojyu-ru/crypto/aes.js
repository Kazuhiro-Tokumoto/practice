// crypto/aes.ts
export async function encrypt(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = await crypto.subtle.encrypt({
        name: "AES-GCM",
        iv: iv
    }, key, plaintext);
    return {
        iv,
        data
    };
}
export async function decrypt(key, iv, data) {
    const plain = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: iv
    }, key, data);
    return new Uint8Array(plain);
}
export async function deriveKeyFromPin(pin, salt) {
    // 6桁の数字をバイナリに変換
    const enc = new TextEncoder();
    const pinData = enc.encode(pin);
    // パスワードをインポート（PBKDF2用）
    const baseKey = await crypto.subtle.importKey("raw", pinData, "PBKDF2", false, ["deriveKey"]);
    // ソルトを混ぜて、AES-GCM用の256ビット鍵を作る
    return await crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt: salt,
        iterations: 5000000, // 500万回回して強度を上げる
        hash: "SHA-256"
    }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
