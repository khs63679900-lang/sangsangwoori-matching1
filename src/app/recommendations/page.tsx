export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function scoreBadgeClass(score: number): string {
  if (score === 6) return 'bg-amber-100 text-amber-700 ring-1 ring-amber-400'
  if (score >= 4) return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-500'
}

function scoreMeaningLabel(score: number): string {
  if (score === 6) return '매우 적합'
  if (score >= 4) return '적합'
  return '보통'
}

function statusLabel(status: string): string {
  if (status === 'assigned') return '배정 완료'
  if (status === 'done') return '완료'
  return '매칭 대기'
}

function statusBadgeClass(status: string): string {
  if (status === 'assigned' || status === 'done') return 'bg-green-100 text-green-700'
  return 'bg-blue-100 text-blue-700'
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: Promise<{ senior_id?: string }>
}) {
  const { senior_id } = await searchParams

  if (!senior_id) {
    return (
      <div className="text-center py-24">
        <p className="text-xl text-gray-500 mb-6">먼저 프로필을 등록해 주세요.</p>
        <Link href="/register" className="text-lg font-semibold underline">
          프로필 등록하기 →
        </Link>
      </div>
    )
  }

  const db = getClient()
  const [{ data: senior }, { data: rawMatches }] = await Promise.all([
    db.from('seniors').select('*').eq('id', senior_id).single(),
    db
      .from('matches')
      .select('*, jobs(*)')
      .eq('senior_id', senior_id)
      .order('score', { ascending: false }),
  ])

  if (!senior) {
    return (
      <div className="text-center py-24">
        <p className="text-xl text-red-500 mb-4">시니어 정보를 찾을 수 없습니다.</p>
        <Link href="/register" className="text-lg font-semibold underline">다시 등록하기 →</Link>
      </div>
    )
  }

  const matches = (rawMatches ?? []).filter((m) => m.score > 0)

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">
        {senior.name} 님께 맞는 일자리
      </h1>
      <p className="text-lg text-gray-500 mb-8">
        {senior.region} · {senior.desired_job} · 경력 {senior.career_years}년
        {senior.desired_salary ? ` · 희망 급여 ${senior.desired_salary}만원` : ''}
      </p>

      {matches.length === 0 ? (
        <div className="py-16 bg-white rounded-2xl border border-gray-200 text-center px-8">
          <p className="text-2xl font-semibold text-gray-700 mb-3">
            현재 매칭되는 일자리가 없습니다.
          </p>
          <p className="text-lg text-gray-500">
            담당자가 직접 연락드리니 잠시만 기다려 주세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xl font-bold truncate">{match.jobs.title}</span>
                <span className="text-lg text-gray-600">
                  {match.jobs.region} · {match.jobs.job_type}
                </span>
                <span className="text-base text-gray-400">최소 경력 {match.jobs.required_career}년</span>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-3xl font-bold px-4 py-1 rounded-xl ${scoreBadgeClass(match.score)}`}>
                  {match.score}점
                </span>
                <span className="text-base font-semibold text-gray-600">
                  {scoreMeaningLabel(match.score)}
                </span>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusBadgeClass(match.status)}`}>
                  {statusLabel(match.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/register" className="text-lg text-gray-400 underline">
          다른 프로필 등록하기
        </Link>
      </div>
    </div>
  )
}
