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

// ecdh.js:27 付近
export async function generateEd25519KeyPair(seed) {
    console.log("🛠️ ECDSA(P-256) 用途を厳格に分離して復元します...");

    // 1. 秘密鍵インポート：用途は ["sign"] だけ！
    const privateKey = await window.crypto.subtle.importKey(
        "raw",
        seed,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign"] // ここに verify を入れたら即死
    );

    // 2. 秘密鍵から公開鍵データを抽出
    const pubBuffer = await window.crypto.subtle.exportKey("raw", privateKey);

    // 3. 公開鍵インポート：用途は ["verify"] だけ！
    const publicKey = await window.crypto.subtle.importKey(
        "raw",
        pubBuffer,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"] // ここに sign を入れたら即死
    );

    return { privateKey, publicKey };
}