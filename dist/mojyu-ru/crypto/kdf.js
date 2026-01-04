/**
 * 共有シークレット (deriveBitsの結果) から、
 * HKDFを使って安全なAES-GCM用のCryptoKeyを導出する。
 * @param sharedBits - deriveSharedSecretから得られた ArrayBuffer
 * @param salt - 毎回ランダムに生成するソルト (16バイト程度)
 * @returns {CryptoKey} - AES-GCMで使える安全な鍵
 *
 *
 *
 */
import { createClient
// @ts-ignore
 } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
export async function deriveAesKeySafe(rawSeed) {
    return await crypto.subtle.importKey("raw", rawSeed, { name: "AES-GCM" }, true, // ← ここを true にすれば、後で exportKey が使えるようになります！
    ["encrypt", "decrypt"]);
}
// 2. HKDFを使って最終的なAES-GCM鍵を導出
export async function testPublicKeyFetch(targetUuid) {
    console.log("🛠️ 実験開始: 窓口(View)からデータ取得を試みます...");
    const supabase = createClient('https://cedpfdoanarzyxcroymc.supabase.co', 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i', {
        global: {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("my_token")}`,
            },
        },
    });
    const { data, error } = await supabase
        .from('public_profiles') // 👈 さっき作った View の名前
        .select('*') // 👈 あえて「全部」リクエストしてみる
        .eq('uuid', targetUuid)
        .maybeSingle();
    if (error) {
        console.error("❌ 失敗:", error.message);
        return null;
    }
    console.log("🎯 取得できたデータ:", data);
    // 検証
    if (data && data.email === undefined && data.ed25519_private === undefined) {
        console.log("✅ 成功！メルアドと秘密鍵は物理的に遮断されています。");
    }
    else if (data) {
        console.warn("⚠️ 警告: 隠すべきデータが見えてしまっています！");
    }
    return data;
}
