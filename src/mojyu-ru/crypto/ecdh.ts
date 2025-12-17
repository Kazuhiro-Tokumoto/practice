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