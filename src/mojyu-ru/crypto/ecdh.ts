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

export async function generateEd25519KeyPair(seed: Uint8Array): Promise<{ privateKey: CryptoKey; publicKey: Uint8Array }> {
  // 1. シードを秘密鍵としてインポート
  const privateKey = await window.crypto.subtle.importKey(
    "raw",
    new Uint8Array(seed),
    { name: "Ed25519" },
    true, // 公開鍵を取り出すためにエクスポートを許可
    ["sign", "verify"]
  );

  // 2. 公開鍵を raw (32バイト) で取り出す
  // Web CryptoのEd25519では、秘密鍵をエクスポートすると公開鍵が得られる仕様です
  const publicKeyBuffer = await window.crypto.subtle.exportKey("raw", privateKey);
  const publicKey = new Uint8Array(publicKeyBuffer);

  return { privateKey, publicKey };
}