export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { AdminView, type SeniorRow } from '@/components/admin-view'
import { JobManagement } from '@/components/job-management'
import { seedSampleJobs, adminLogout } from '@/app/actions'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function AdminPage() {
  const db = getClient()

  const [{ data: seniors }, { data: allMatches }, { data: jobs }] = await Promise.all([
    db.from('seniors').select('*').order('created_at', { ascending: false }),
    db.from('matches').select('*, jobs(*)').order('score', { ascending: false }),
    db.from('jobs').select('*').order('created_at', { ascending: false }),
  ])
  const jobCount = jobs?.length ?? 0

  const matchMap = new Map<string, typeof allMatches>()
  allMatches?.forEach((m) => {
    if (!matchMap.has(m.senior_id)) matchMap.set(m.senior_id, [])
    matchMap.get(m.senior_id)!.push(m)
  })

  const buildRow = (s: NonNullable<typeof seniors>[number]): SeniorRow => ({
    senior: s,
    matches: matchMap.get(s.id) ?? [],
  })

  const unmatched: SeniorRow[] = []
  const pending: SeniorRow[]   = []
  const assigned: SeniorRow[]  = []

  seniors?.forEach((s) => {
    const matches = matchMap.get(s.id) ?? []
    if (matches.length === 0) {
      unmatched.push(buildRow(s))
    } else if (matches.some((m) => m.status === 'assigned' || m.status === 'done')) {
      assigned.push(buildRow(s))
    } else {
      pending.push(buildRow(s))
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">담당자 대시보드</h1>
        <div className="flex items-center gap-3">
          {jobCount === 0 && (
            <form action={seedSampleJobs}>
              <button
                type="submit"
                className="h-10 px-4 rounded-lg border border-dashed border-gray-400 text-sm text-gray-500 hover:border-gray-700 hover:text-gray-900 transition-colors"
              >
                샘플 일자리 6개 등록
              </button>
            </form>
          )}
          <form action={adminLogout}>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg border border-gray-300 text-sm text-gray-500 hover:border-gray-700 hover:text-gray-900 transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>
      <p className="text-lg text-gray-500 mb-8">
        매칭 현황을 한눈에 확인하고 관리합니다.
        {jobCount === 0 && (
          <span className="ml-2 text-amber-600 font-medium">⚠ 일자리 데이터가 없습니다. 위 버튼으로 샘플을 등록하세요.</span>
        )}
      </p>

      <AdminView unmatched={unmatched} pending={pending} assigned={assigned} />
      <JobManagement jobs={jobs ?? []} />
    </div>
  )
}
