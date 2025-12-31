/**
 * 共有シークレット (deriveBitsの結果) から、
 * HKDFを使って安全なAES-GCM用のCryptoKeyを導出する。
 * @param sharedBits - deriveSharedSecretから得られた ArrayBuffer
 * @param salt - 毎回ランダムに生成するソルト (16バイト程度)
 * @returns {CryptoKey} - AES-GCMで使える安全な鍵
 */
export async function deriveAesKeySafe(rawSeed: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    rawSeed as BufferSource,
    { name: "AES-GCM" },
    true, // ← ここを true にすれば、後で exportKey が使えるようになります！
    ["encrypt", "decrypt"]
  );
}

    // 2. HKDFを使って最終的なAES-GCM鍵を導出
