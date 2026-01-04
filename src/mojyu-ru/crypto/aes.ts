// crypto/aes.ts
/**
 * 自分のX25519秘密鍵と相手のX25519公開鍵からAES鍵を作る
 */
export async function deriveSharedKey(myPrivateKey: CryptoKey, theirPublicKey: CryptoKey) {
    return await window.crypto.subtle.deriveKey(
        {
            name: "X25519",
            public: theirPublicKey,
        },
        myPrivateKey,
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function encrypt(
    key: CryptoKey,
    plaintext: BufferSource
): Promise < {
    iv: Uint8Array;data: ArrayBuffer
} > {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const data = await crypto.subtle.encrypt({
            name: "AES-GCM",
            iv: iv as BufferSource
        },
        key,
        plaintext
    );

    return {
        iv,
        data
    };
}

export async function aesKeyToArray(aesKey: CryptoKey): Promise<Uint8Array> {
  // AES-GCM 鍵も "raw" 形式で 32バイト（256bit）として取り出せます
  const exported = await window.crypto.subtle.exportKey("raw", aesKey);
  
  return new Uint8Array(exported);
}

export async function decrypt(
    key: CryptoKey,
    iv: Uint8Array,
    data: ArrayBuffer
): Promise < Uint8Array > {
    const plain = await crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: iv as BufferSource
        },
        key,
        data
    );

    return new Uint8Array(plain);
}

export async function deriveKeyFromPin(pin: string, salt: Uint8Array) {
  // 6桁の数字をバイナリに変換
  const enc = new TextEncoder();
  const pinData = enc.encode(pin);

  // パスワードをインポート（PBKDF2用）
  const baseKey = await crypto.subtle.importKey(
    "raw", pinData, "PBKDF2", false, ["deriveKey"]
  );

  // ソルトを混ぜて、AES-GCM用の256ビット鍵を作る
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 5000000, // 500万回回して強度を上げる
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}