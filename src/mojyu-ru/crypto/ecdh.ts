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
    console.log("🛠️ Ed25519を再点火。seedから鍵を完全再現します...");

    // seed(32バイト)をそのまま秘密鍵の材料としてインポート
    const privateKey = await window.crypto.subtle.importKey(
        "raw",
        seed,
        { name: "Ed25519" },
        true,
        ["sign"]
    );

    // 秘密鍵から公開鍵を導出（これがEd25519の強み！）
    const publicKey = await window.crypto.subtle.importKey(
        "raw",
        seed,
        { name: "Ed25519" },
        true,
        ["verify"]
    );
    
    // 公開鍵のエクスポート（例）
    // const publicKey = ... (マインさんのモジュール内の既存ロジック)

    return { privateKey, publicKey };
}