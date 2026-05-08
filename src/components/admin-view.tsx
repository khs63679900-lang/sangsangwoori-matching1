'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import { assignMatch } from '@/app/actions'

type Job = { id: string; title: string; region: string; job_type: string; required_career: number }
type Match = { id: string; senior_id: string; job_id: string; score: number; status: string; jobs: Job }
type Senior = { id: string; name: string; region: string; desired_job: string; career_years: number }
export type SeniorRow = { senior: Senior; matches: Match[] }

type Tab = 'unmatched' | 'pending' | 'assigned'

const TABS: { id: Tab; label: string; emptyMsg: string; icon: React.ReactNode }[] = [
  { id: 'unmatched', label: '미매칭',   emptyMsg: '미매칭 시니어가 없습니다.',        icon: <AlertTriangle className="size-7 mx-auto mb-2" /> },
  { id: 'pending',   label: '매칭 대기', emptyMsg: '매칭 대기 중인 시니어가 없습니다.', icon: <Clock         className="size-7 mx-auto mb-2" /> },
  { id: 'assigned',  label: '배정 완료', emptyMsg: '배정 완료된 시니어가 없습니다.',    icon: <CheckCircle2  className="size-7 mx-auto mb-2" /> },
]

const CARD_STYLE: Record<Tab, string> = {
  unmatched: 'bg-gray-100 text-gray-500',
  pending: 'bg-blue-100 text-blue-700',
  assigned: 'bg-green-100 text-green-700',
}

function matchStatusBadge(status: string) {
  if (status === 'assigned') return 'bg-green-100 text-green-700'
  if (status === 'done') return 'bg-emerald-100 text-emerald-700'
  return 'bg-blue-100 text-blue-700'
}

function matchStatusLabel(status: string) {
  if (status === 'assigned') return '배정 완료'
  if (status === 'done') return '완료'
  return '매칭 대기'
}

function scoreBadgeClass(score: number): string {
  if (score === 6) return 'bg-amber-100 text-amber-700'
  if (score >= 4) return 'bg-green-100 text-green-700'
  if (score >= 2) return 'bg-gray-100 text-gray-500'
  return 'bg-gray-50 text-gray-400'
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
      {/* 요약 카드 */}
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
            {tab.icon}
            <p className="text-lg font-semibold mb-1">{tab.label}</p>
            <p className="text-4xl font-bold">{counts[tab.id]}</p>
            <p className="text-base opacity-60 mt-1">명</p>
          </button>
        ))}
      </div>

      {/* 시니어 목록 테이블 */}
      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-xl text-gray-400">{emptyMsg}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 text-base font-semibold">이름</th>
                <th className="px-5 py-4 text-base font-semibold">지역</th>
                <th className="px-5 py-4 text-base font-semibold">희망 직종</th>
                <th className="px-5 py-4 text-base font-semibold">최고 점수</th>
                <th className="px-5 py-4 text-base font-semibold">상태</th>
                <th className="px-5 py-4 text-base font-semibold">상세 보기</th>
                {activeTab === 'pending' && <th className="px-5 py-4" />}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ senior, matches }) => {
                const topMatch = matches[0]
                const topScore = topMatch?.score ?? 0
                const isAssigning = topMatch && assigningId === topMatch.id
                const topStatus = topMatch?.status ?? 'pending'

                return (
                  <tr key={senior.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4 text-base font-semibold">{senior.name}</td>
                    <td className="px-5 py-4 text-base">{senior.region}</td>
                    <td className="px-5 py-4 text-base">{senior.desired_job}</td>
                    <td className="px-5 py-4">
                      {topScore > 0 ? (
                        <span className={`text-lg font-bold px-3 py-1 rounded-lg ${scoreBadgeClass(topScore)}`}>
                          {topScore}점
                        </span>
                      ) : (
                        <span className="text-base text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                        activeTab === 'unmatched'
                          ? 'bg-gray-100 text-gray-500'
                          : matchStatusBadge(topStatus)
                      }`}>
                        {activeTab === 'unmatched' ? '미매칭' : matchStatusLabel(topStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/recommendations?senior_id=${senior.id}`}
                        className="inline-flex h-12 items-center px-5 rounded-xl border-2 border-gray-300 text-base font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
                      >
                        상세 보기
                      </Link>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-5 py-4">
                        {topMatch && (
                          <button
                            onClick={() => handleAssign(topMatch.id)}
                            disabled={isPending}
                            className="h-12 px-5 rounded-xl bg-gray-900 text-white text-base font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
