import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { generateSalt } from '../crypto/saltaes.js';

// 初期化（ここはマインさんの既存コード通り）
const myUuid = localStorage.getItem("my_uuid"); 
const supabaseUrl = 'https://cedpfdoanarzyxcroymc.supabase.co'
const supabaseKey = 'sb_publishable_E5jwgv5t2ONFKg3yFENQmw_lVUSFn4i'
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * 1. 申請を送る
 */
export async function sendRequest(targetUuid: string, myPublicKey: any) {
  const salt = generateSalt();
  const base64Salt = btoa(String.fromCharCode(...salt));

  return await supabase.from('Friendsinsei').insert({
    uuid: myUuid,
    uuidfri: targetUuid,
    public_key: myPublicKey,
    salt: base64Salt,
    sinsei_kyoka: false
  });
}

/**
 * 2. 自分宛の未承認申請をリストアップする
 */
export async function fetchIncomingRequests() {
  return await supabase
    .from('Friendsinsei')
    .select('*')
    .eq('uuidfri', myUuid)
    .eq('sinsei_kyoka', false);
}

/**
 * 3. 申請を承認する（相手側の操作）
 */
export async function approveRequest(recordUuid: string, myPublicKey: any) {
  return await supabase
    .from('Friendsinsei')
    .update({
      public_key_fri: myPublicKey,
      sinsei_kyoka: true
    })
    .eq('uuid', recordUuid) // 申請者のUUID
    .eq('uuidfri', myUuid); // 宛先が自分であること
}

/**
 * 4. お掃除（削除）
 */
export async function deleteRequest(recordUuid: string) {
  return await supabase
    .from('Friendsinsei')
    .delete()
    .eq('uuid', recordUuid);
}