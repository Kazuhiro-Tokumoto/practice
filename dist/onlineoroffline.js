import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://cedpfdoanarzyxcroymc.supabase.co';
const supabaseKey = 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i';
export const supabase = createClient(supabaseUrl, supabaseKey);

// 全ユーザーを一覧取得してコンソールに表示する関数
export async function checkUserOnline() {
    const { data, error } = await supabase
        .from('profile_users')
        .select('uuid, is_active, email, username')
        .order('created_at', { ascending: false }); // 新しい順に並べる

    if (error) {
        console.error("全ユーザー取得エラー:", error.message);
        return [];
    }

    console.log("=== 全ユーザー一覧 ===");
    data.forEach(user => {
        const name = user.username || user.email || "不明";
        const status = user.is_active ? "🟢 オンライン" : "⚪ オフライン";
        console.log(`[${status}] 名前: ${name} | UUID: ${user.uuid}`);
    });

    return data;
}