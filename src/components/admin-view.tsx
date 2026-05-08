'use client'

import { useState, useTransition } from 'react'
import { assignMatch } from '@/app/actions'

type Job = { id: string; title: string; region: string; job_type: string; required_career: number }
type Match = { id: string; senior_id: string; job_id: string; score: number; status: string; jobs: Job }
type Senior = { id: string; name: string; region: string; desired_job: string; career_years: number }
export type SeniorRow = { senior: Senior; matches: Match[] }

type Tab = 'unmatched' | 'pending' | 'assigned'

const TABS: { id: Tab; label: string; emptyMsg: string }[] = [
  { id: 'unmatched', label: '미매칭', emptyMsg: '미매칭 시니어가 없습니다.' },
  { id: 'pending', label: '매칭 대기', emptyMsg: '매칭 대기 중인 시니어가 없습니다.' },
  { id: 'assigned', label: '배정 완료', emptyMsg: '배정 완료된 시니어가 없습니다.' },
]

const STATUS_BADGE: Record<Tab, string> = {
  unmatched: 'bg-gray-100 text-gray-500',
  pending: 'bg-blue-100 text-blue-700',
  assigned: 'bg-green-100 text-green-700',
}

const STATUS_LABEL: Record<Tab, string> = {
  unmatched: '미매칭',
  pending: '매칭 대기',
  assigned: '배정 완료',
}

export function AdminView({
  unmatched,
  pending,
  assigned,
}: {
  unmatched: SeniorRow[]
  pending: SeniorRow[]
  assigned: SeniorRow[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [isPending, startTransition] = useTransition()
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const counts = { unmatched: unmatched.length, pending: pending.length, assigned: assigned.length }
  const rows = activeTab === 'unmatched' ? unmatched : activeTab === 'pending' ? pending : assigned
  const { emptyMsg } = TABS.find((t) => t.id === activeTab)!

  function handleAssign(matchId: string) {
    setAssigningId(matchId)
    startTransition(async () => {
      await assignMatch(matchId)
      setAssigningId(null)
    })
  }

  return (
    <>
      {/* 요약 카드 — 클릭하면 탭 전환 */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl border p-6 text-center transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white border-gray-200 hover:border-gray-400'
            }`}
          >
            <p className="text-base font-semibold mb-1">{tab.label}</p>
            <p className="text-4xl font-bold">{counts[tab.id]}</p>
            <p className="text-sm opacity-60 mt-1">명</p>
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-xl text-gray-400">{emptyMsg}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 text-base font-semibold">시니어</th>
                <th className="px-5 py-4 text-base font-semibold">지역 · 희망직종</th>
                <th className="px-5 py-4 text-base font-semibold">추천 일자리</th>
                <th className="px-5 py-4 text-base font-semibold">점수</th>
                <th className="px-5 py-4 text-base font-semibold">상태</th>
                {activeTab === 'pending' && <th className="px-5 py-4" />}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ senior, matches }) => {
                const topMatch = matches[0]
                const isAssigning = topMatch && assigningId === topMatch.id

                return (
                  <tr key={senior.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4 text-base font-semibold">{senior.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {senior.region}<br />{senior.desired_job} · {senior.career_years}년
                    </td>
                    <td className="px-5 py-4 text-base">
                      {topMatch ? (
                        <>
                          <span className="font-medium">{topMatch.jobs.title}</span>
                          <br />
                          <span className="text-sm text-gray-400">{topMatch.jobs.region}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-4 text-xl font-bold">
                      {topMatch ? `${topMatch.score}점` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_BADGE[activeTab]}`}>
                        {STATUS_LABEL[activeTab]}
                      </span>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-5 py-4">
                        {topMatch && (
                          <button
                            onClick={() => handleAssign(topMatch.id)}
                            disabled={isPending}
                            className="h-10 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isAssigning ? '처리 중…' : '배정하기'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
