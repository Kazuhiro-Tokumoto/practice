// Supabaseの型定義をインポート（npmを使っている場合）
// import { createClient, Session } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://cedpfdoanarzyxcroymc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
// サインイン処理
async function signIn() {
    await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
}
// サインアウト処理
async function signOut() {
    await supabaseClient.auth.signOut();
    location.reload();
}
// 初期化処理
async function init() {
    const statusDiv = document.getElementById('status');
    const authUi = document.getElementById('auth-ui');
    if (!statusDiv)
        return;
    // 1. セッション（ログイン状態）の取得
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
        statusDiv.innerHTML = `<span class="error">Authエラー: ${error.message}</span>`;
        return;
    }
    if (session) {
        // session.user に型を適用
        const user = session.user;
        // 1. localStorageにデータを保存（型安全なアクセス）
        localStorage.setItem("my_token", session.access_token);
        localStorage.setItem("my_uuid", user.id);
        // メタデータはオプショナルなので、?? を使って安全に取得
        const fullName = user.user_metadata.full_name ?? "不明なユーザー";
        localStorage.setItem("my_name", fullName);
        statusDiv.innerHTML = `<span class="success">✅ 認証成功！チャット画面へ移動します...</span>`;
        // 2. チャット画面へ転送
        setTimeout(() => {
            window.location.href = "./dist/index.html";
        }, 500);
    }
    else {
        statusDiv.innerText = 'ステータス: 未ログイン';
    }
}
// グローバルスコープに関数を公開（HTMLのonclickから呼ぶため）
window.signIn = signIn;
window.signOut = signOut;
// 起動
init();
