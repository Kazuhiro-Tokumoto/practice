/**
 * 共有シークレット (deriveBitsの結果) から、
 * HKDFを使って安全なAES-GCM用のCryptoKeyを導出する。
 * @param sharedBits - deriveSharedSecretから得られた ArrayBuffer
 * @param salt - 毎回ランダムに生成するソルト (16バイト程度)
 * @returns {CryptoKey} - AES-GCMで使える安全な鍵
 */
export async function deriveAesKeySafe(
    sharedBits: ArrayBuffer,
    salt: BufferSource
): Promise<CryptoKey> {

    // 1. 共有シークレットを KDK (Key Derivation Key) としてインポート
    const kdk = await crypto.subtle.importKey(
        "raw",
        sharedBits,
        // ここに hash の指定は不要。 deriveKey の方に必要。
        { name: "HKDF" }, 
        false,
        ["deriveKey"]
    );

    // 2. HKDFを使って最終的なAES-GCM鍵を導出
    const aesKey = await crypto.subtle.deriveKey(
        {
            name: "HKDF",
            // ★★★ 修正箇所：hash アルゴリズムを追加します ★★★
            hash: "SHA-256", 
            salt: salt,
            info: new TextEncoder().encode("aes-gcm encryption key")
        },
        kdk,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return aesKey;
}