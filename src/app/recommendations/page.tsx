export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function scoreBadgeClass(score: number) {
  if (score >= 70) return 'bg-green-100 text-green-700'
  if (score >= 40) return 'bg-yellow-100 text-yellow-700'
  return 'bg-orange-100 text-orange-700'
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
  const [{ data: senior }, { data: matches }] = await Promise.all([
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">매칭 추천 목록</h1>
      <p className="text-lg text-gray-500 mb-8">
        <span className="font-semibold text-gray-900">{senior.name}</span>님 (
        {senior.region} · {senior.desired_job} · 경력 {senior.career_years}년)께 추천드리는 일자리입니다.
      </p>

      {!matches || matches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-xl text-gray-400 mb-3">매칭되는 일자리가 없습니다.</p>
          <p className="text-base text-gray-400">
            담당자에게 문의하거나, 담당자가 일자리 데이터를 먼저 등록해야 합니다.
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
                <span className="text-xl font-semibold truncate">{match.jobs.title}</span>
                <span className="text-base text-gray-500">
                  {match.jobs.region} · {match.jobs.job_type}
                </span>
                <span className="text-sm text-gray-400">최소 경력 {match.jobs.required_career}년</span>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-3xl font-bold px-3 py-1 rounded-xl ${scoreBadgeClass(match.score)}`}>
                  {match.score}점
                </span>
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    match.status === 'assigned'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {match.status === 'assigned' ? '배정 완료' : '매칭 대기'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/register" className="text-base text-gray-400 underline">
          다른 프로필 등록하기
        </Link>
      </div>
    </div>
  )
}
