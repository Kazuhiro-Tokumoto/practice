/**
 * MineSignature: マイン独自のシュノア署名クラス
 * 基盤: Oakley Group 14 (2048-bit)
 */
class MineSignature {
  // --- 定数定義 ---
  private readonly p: bigint = BigInt("0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF");
  private readonly g: bigint = 2n;
  private readonly q: bigint = BigInt("0x7FFFFFFFFFFFFFFFE487ED5110B4611A62633145C06E0E68948127044533E63A0105DF531D89CD1128A5043CC71A026EF7CA8CD9E69D218D98158536F92F8A1BA7F09AB6B6A8E122F242DAFB312F3F637A262174D31BEEB585FFADDB7A035BF6F71C35FDAD44CFCAD74F8F25FF32494332A8F66EE61EE1003E5C50B1DF02CC6A241B0E1B19B0E62AD1A9256ED269339661A775E125D67E916E91EED1D6CB16E80E31795DCEB94B3B3B36B3B3B33BFFFFFFFFFFFFFFFF");

  constructor() {}

  // --- 変換ユーティリティ ---

  private bigintToUint8Array(bn: bigint): Uint8Array {
    let hex = bn.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const len = hex.length / 2;
    const u8 = new Uint8Array(256); // 2048bit = 256byte
    for (let i = 0; i < len; i++) {
      u8[256 - len + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return u8;
  }

  private uint8ArrayToBigInt(u8: Uint8Array): bigint {
    let hex = "";
    u8.forEach(b => hex += b.toString(16).padStart(2, "0"));
    return BigInt("0x" + hex);
  }

  private async hashToBigInt(data: Uint8Array): Promise<bigint> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data as BufferSource);
    return this.uint8ArrayToBigInt(new Uint8Array(hashBuffer));
  }

  private modExp(base: bigint, exp: bigint, mod: bigint): bigint {
    let res = 1n;
    base = base % mod;
    while (exp > 0n) {
      if (exp % 2n === 1n) res = (res * base) % mod;
      base = (base * base) % mod;
      exp = exp / 2n;
    }
    return res;
  }

  // --- 公開メソッド ---

  /** 公開鍵の生成 */
  public async getPublicKey(privateKey: Uint8Array): Promise<Uint8Array> {
    const priv = this.uint8ArrayToBigInt(privateKey);
    const pub = this.modExp(this.g, priv, this.p);
    return this.bigintToUint8Array(pub);
  }

  /** 署名の生成 (R + s = 512バイト) */
  public async sign(message: string, privateKey: Uint8Array): Promise<Uint8Array> {
    const priv = this.uint8ArrayToBigInt(privateKey);
    const msgData = new TextEncoder().encode(message);
    
    // 決定論的 k 生成 (RFC 6979 的アプローチ)
    const kSeed = new Uint8Array([...privateKey, ...msgData]);
    const k = (await this.hashToBigInt(kSeed)) % this.q;

    const R = this.modExp(this.g, k, this.p);
    const R_bytes = this.bigintToUint8Array(R);
    
    const e = (await this.hashToBigInt(new Uint8Array([...R_bytes, ...msgData]))) % this.q;
    const s = (k + (e * priv)) % this.q;

    const signature = new Uint8Array(512);
    signature.set(R_bytes, 0);
    signature.set(this.bigintToUint8Array(s), 256);
    return signature;
  }

  /** 署名の検証 */
  public async verify(message: string, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
    if (signature.length !== 512) return false;
    
    const pub = this.uint8ArrayToBigInt(publicKey);
    const msgData = new TextEncoder().encode(message);
    
    const R_bytes = signature.slice(0, 256);
    const s_bytes = signature.slice(256, 512);
    
    const R = this.uint8ArrayToBigInt(R_bytes);
    const s = this.uint8ArrayToBigInt(s_bytes);
    
    const e = (await this.hashToBigInt(new Uint8Array([...R_bytes, ...msgData]))) % this.q;

    const leftSide = this.modExp(this.g, s, this.p);
    const rightSide = (R * this.modExp(pub, e, this.p)) % this.p;

    return leftSide === rightSide;
  }
}

// --- 実行デモ ---
(async () => {
  const mSign = new MineSignature();

  // 1. 秘密鍵を安全な乱数で生成 (32バイト)
  const myPrivKey = new Uint8Array(32);
  crypto.getRandomValues(myPrivKey);
  
  // 16進数で表示（保存用）
  const privHex = Array.from(myPrivKey).map(b => b.toString(16).padStart(2, '0')).join('');
  console.log("%c[鍵生成] 秘密鍵(乱数):", "color: orange; font-weight: bold;", privHex);

  // 2. 公開鍵を生成
  const myPubKey = await mSign.getPublicKey(myPrivKey);
  console.log("%c[鍵生成] 公開鍵を生成しました", "color: green;");

  // 3. 署名テスト
  const message = "これは物理班の極秘データです。";
  const signature = await mSign.sign(message, myPrivKey);
  console.log("%c[署名] 署名を生成完了 (512バイト)", "color: blue;");

  // 4. 検証テスト
  const isValid = await mSign.verify(message, signature, myPubKey);
  console.log("%c[検証] 結果:", "font-size: 1.2em;", isValid ? "✅ 認証成功！マイン本人です。" : "❌ 認証失敗...");

  // 5. 改ざんテスト
  const fakeMessage = "これは物理班の公開データです。";
  const isFakeValid = await mSign.verify(fakeMessage, signature, myPubKey);
  console.log("%c[偽造テスト] 結果:", "font-size: 1.2em;", isFakeValid ? "❌ 偽造を見抜けませんでした" : "✅ 改ざんを検知しました！");
})();