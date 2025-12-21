
import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

// 初期化（ここはマインさんの既存コード通り）
const myUuid = localStorage.getItem("my_uuid"); 
const supabaseUrl = 'https://cedpfdoanarzyxcroymc.supabase.co'
const supabaseKey = 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i'
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
export async function checkUserOnline(targetUuid: string) {
    const { data, error } = await supabase
        .from('profile_users')
        .select('is_active, name')
        .eq('uuid', targetUuid)
        .single(); // 1件だけ取得

    if (error) {
        console.error("状態取得エラー:", error.message);
        return false;
    }

    if (data) {
        console.log(`${data.name} さんの状態: ${data.is_active ? "オンライン" : "オフライン"}`);
        return data.is_active;
    }
    return false;
}