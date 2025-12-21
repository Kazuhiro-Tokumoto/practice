import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 2. 初期化 (マインさんのプロジェクト情報)
const supabaseUrl = 'https://cedpfdoanarzyxcroymc.supabase.co'
const supabaseKey = 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i' // Dashboardからコピー
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

/**
 * 承認処理
 */
export async function approveFriendRequest(applicantUuid: string, myPublicKey: any) {
  const myUuid = localStorage.getItem("my_uuid"); 

  const { error } = await supabase
    .from('Friendsinsei')
    .update({
      public_key_fri: myPublicKey,
      sinsei_kyoka: true
    })
    .eq('uuid', applicantUuid) // ← 'id' ではなく 'uuid' で行を探す
    .eq('uuidfri', myUuid);     
    
  if (error) {
    console.error("承認エラー:", error.message);
  } else {
    console.log("承認完了！");
  }
}