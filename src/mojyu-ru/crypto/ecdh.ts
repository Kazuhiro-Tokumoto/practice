export async function generateKeyPair() {
    return crypto.subtle.generateKey({
            name: "ECDH",
            namedCurve: "P-256"
        },
        false,
        ["deriveBits"]
    );
}

// mojyu-ru/crypto/ecdh.ts

/**
 * 相手のJWK公開鍵と自分の秘密鍵から共有秘密(Shared Secret)を導出する
 */
export async function deriveSharedSecret(
  myPrivateKey: CryptoKey,
  remoteJwk: JsonWebKey
): Promise<ArrayBuffer> {
  // 1. 相手のJWKをCryptoKeyオブジェクトにインポート
  const remotePublicKey = await crypto.subtle.importKey(
    "jwk",
    remoteJwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    []
  );

  // 2. 自分の秘密鍵と相手の公開鍵で共有秘密を生成
  return await crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: remotePublicKey,
    },
    myPrivateKey,
    256 // 256ビットの共有秘密を導出
  );
}

export async function generateEd25519KeyPair(seed) {
    // 1. シードを秘密鍵としてインポート (Ed25519の秘密鍵は "sign" のみ許可)
    const privateKey = await window.crypto.subtle.importKey(
        "raw", 
        new Uint8Array(seed), 
        { name: "Ed25519" }, 
        true, 
        ["sign"] // ← ここを "sign" だけにする！
    );

    // 2. 秘密鍵から公開鍵を取り出す
    const publicKeyBuffer = await window.crypto.subtle.exportKey("raw", privateKey);
    const publicKey = new Uint8Array(publicKeyBuffer);

    return { privateKey, publicKey };
}