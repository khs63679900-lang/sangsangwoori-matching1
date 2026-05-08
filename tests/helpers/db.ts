import { createClient } from '@supabase/supabase-js'

export function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase 환경 변수가 설정되지 않았습니다')
  return createClient(url, key)
}

/** 테스트 격리용: matches → seniors → jobs 순으로 전체 삭제 */
export async function clearAll() {
  const db = getDb()
  await db.from('matches').delete().gte('created_at', '2020-01-01')
  await db.from('seniors').delete().gte('created_at', '2020-01-01')
  await db.from('jobs').delete().gte('created_at', '2020-01-01')
}
