// -------------------------------------------------------------
// 必要なモジュールのインポート (あなたの作成したファイルから)
// -------------------------------------------------------------
import { generateKeyPair, deriveSharedSecret } from "./mojyu-ru/index.js";
import { encrypt, decrypt } from "./mojyu-ru/index.js";
import { deriveAesKeySafe } from "./mojyu-ru/index.js"; // HKDFを使った安全な鍵導出関数 (前回の修正案を仮定)
// メッセージ変換ユーティリティ
const encoder = new TextEncoder();
const decoder = new TextDecoder();
async function runEncryptionDemo() {
    console.log("--- 1. ECDH 鍵ペアの生成 ---");
    // 鍵ペア生成 (AliceとBobがそれぞれ行う)
    const aliceKeys = await generateKeyPair();
    const bobKeys = await generateKeyPair();
    console.log("Alice keys:", aliceKeys);
    console.log("Bob keys:", bobKeys);
    // -------------------------------------------------------------
    // 鍵交換のステップ
    // -------------------------------------------------------------
    console.log("\n--- 2. 共有シークレットの導出 ---");
    // Alice: 自分の秘密鍵 + Bobの公開鍵
    const sharedSecretAlice = await deriveSharedSecret(aliceKeys.privateKey, bobKeys.publicKey);
    // Bob: 自分の秘密鍵 + Aliceの公開鍵
    const sharedSecretBob = await deriveSharedSecret(bobKeys.privateKey, aliceKeys.publicKey);
    // 導出されたシークレットは、両者で一致するはず
    console.log("共有シークレットは一致します (サイズ):", sharedSecretAlice.byteLength);
    // -------------------------------------------------------------
    // 鍵導出関数 (KDF) のステップ (AES鍵の安全な生成)
    // -------------------------------------------------------------
    console.log("\n--- 3. HKDFを使ったAES鍵の安全な導出 ---");
    // **【重要】** ソルトはランダムに生成し、暗号データと一緒に相手に渡します。
    const salt = crypto.getRandomValues(new Uint8Array(16));
    console.log("生成されたランダムソルト:", salt);
    // AliceとBobは、同じ共有シークレットとソルトを使って、最終的な鍵を導出
    const aesKeyAlice = await deriveAesKeySafe(sharedSecretAlice, salt);
    const aesKeyBob = await deriveAesKeySafe(sharedSecretBob, salt);
    // この2つの鍵オブジェクトは、中身が一致します
    console.log("AES暗号化用の鍵が導出されました。");
    console.log("AliceのAES鍵:", aesKeyAlice);
    console.log("BobのAES鍵:", aesKeyBob);
    // -------------------------------------------------------------
    // 暗号化と復号化のステップ
    // -------------------------------------------------------------
    console.log("\n--- 4. メッセージの暗号化と復号化 ---");
    const originalMessage = "Go言語はシンプルだが、暗号化は複雑だね。";
    const plaintextBuffer = encoder.encode(originalMessage);
    // 🔒 暗号化 (Aliceが実行)
    const encryptedData = await encrypt(aesKeyAlice, plaintextBuffer);
    console.log("暗号化データ:", encryptedData);
    console.log("IV:", encryptedData.iv);
    // 🔓 復号化 (Bobが実行)
    // Aliceから送られた暗号データ、IV、ソルトを使って復号化
    const decryptedBuffer = await decrypt(aesKeyBob, encryptedData.iv, encryptedData.data);
    const decryptedMessage = decoder.decode(decryptedBuffer);
    console.log("復号化されたメッセージ:", decryptedMessage);
    if (originalMessage === decryptedMessage) {
        console.log("✅ 成功！オリジナルと復号化メッセージは一致しました。");
    }
    else {
        console.log("❌ 失敗。メッセージが一致しません。");
    }
}
runEncryptionDemo().catch(e => console.error("実行中に致命的なエラーが発生しました:", e));
