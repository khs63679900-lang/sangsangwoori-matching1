'use client'

import React, { useState, useTransition, useActionState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, CheckCircle2, Search } from 'lucide-react'
import {
  assignMatch, unassignMatch, completeMatch,
  deleteSenior, updateSenior, type UpdateSeniorState,
} from '@/app/actions'

type Job = { id: string; title: string; region: string; job_type: string; required_career: number }
type Match = { id: string; senior_id: string; job_id: string; score: number; status: string; jobs: Job }
type Senior = {
  id: string; name: string; region: string; desired_job: string
  career_years: number; desired_salary?: number | null
  phone?: string | null; memo?: string | null
}
export type SeniorRow = { senior: Senior; matches: Match[] }

type Tab = 'unmatched' | 'pending' | 'assigned'
type Panel = 'assign' | 'edit' | null

const TABS: { id: Tab; label: string; emptyMsg: string; icon: React.ReactNode }[] = [
  { id: 'unmatched', label: '미매칭',    emptyMsg: '미매칭 시니어가 없습니다.',         icon: <AlertTriangle className="size-7 mx-auto mb-2" /> },
  { id: 'pending',   label: '매칭 대기', emptyMsg: '매칭 대기 중인 시니어가 없습니다.', icon: <Clock         className="size-7 mx-auto mb-2" /> },
  { id: 'assigned',  label: '배정 완료', emptyMsg: '배정 완료된 시니어가 없습니다.',    icon: <CheckCircle2  className="size-7 mx-auto mb-2" /> },
]

const REGIONS   = ['서울', '경기', '인천', '기타'] as const
const JOB_TYPES = ['경비', '청소', '조리', '돌봄', '기타'] as const

function matchStatusBadge(status: string) {
  if (status === 'assigned') return 'bg-green-100 text-green-700'
  if (status === 'done')     return 'bg-emerald-100 text-emerald-700'
  return 'bg-blue-100 text-blue-700'
}
function matchStatusLabel(status: string) {
  if (status === 'assigned') return '배정 완료'
  if (status === 'done')     return '취업 완료'
  return '매칭 대기'
}
function scoreBadgeClass(score: number): string {
  if (score === 6) return 'bg-amber-100 text-amber-700'
  if (score >= 4)  return 'bg-green-100 text-green-700'
  if (score >= 2)  return 'bg-gray-100 text-gray-500'
  return 'bg-gray-50 text-gray-400'
}

// ── 시니어 수정 인라인 폼 ──────────────────────────────────────────────────

const EDIT_INITIAL: UpdateSeniorState = {}

function EditPanel({ senior, onClose }: { senior: Senior; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateSenior, EDIT_INITIAL)

  if (state.success) {
    onClose()
    return null
  }

  return (
    <tr className="bg-yellow-50 border-b border-yellow-100">
      <td colSpan={9} className="px-8 py-5">
        <p className="text-base font-semibold text-yellow-800 mb-4">
          {senior.name} 님 정보 수정
        </p>
        <form action={formAction} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="id" value={senior.id} />

          {state.errors?._form && (
            <div className="col-span-2 bg-red-50 border border-red-400 rounded-xl px-4 py-2">
              <p className="text-red-700 font-semibold text-sm">{state.errors._form}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">이름 *</label>
            <input name="name" defaultValue={senior.name}
              className="h-11 rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900" />
            {state.errors?.name && <p className="text-red-600 text-sm">{state.errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">연락처</label>
            <input name="phone" defaultValue={senior.phone ?? ''}
              className="h-11 rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">지역 *</label>
            <select name="region" defaultValue={senior.region}
              className="h-11 rounded-xl border border-gray-300 px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">희망 직종 *</label>
            <select name="desired_job" defaultValue={senior.desired_job}
              className="h-11 rounded-xl border border-gray-300 px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
              {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">경력 (년)</label>
            <input name="career_years" type="number" min="0" defaultValue={senior.career_years}
              className="h-11 rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">희망 급여 (만원)</label>
            <input name="desired_salary" type="number" min="0" defaultValue={senior.desired_salary ?? 0}
              className="h-11 rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-semibold">메모</label>
            <textarea name="memo" defaultValue={senior.memo ?? ''} rows={2}
              className="rounded-xl border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="h-10 px-5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
              취소
            </button>
            <button type="submit" disabled={isPending}
              className="h-10 px-5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
              {isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────

export function AdminView({
  unmatched, pending, assigned,
}: {
  unmatched: SeniorRow[]
  pending: SeniorRow[]
  assigned: SeniorRow[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId]     = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [panelType, setPanelType]   = useState<Panel>(null)

  // 검색/필터
  const [search,    setSearch]    = useState('')
  const [filterReg, setFilterReg] = useState('')
  const [filterJob, setFilterJob] = useState('')

  const allRows = activeTab === 'unmatched' ? unmatched : activeTab === 'pending' ? pending : assigned
  const counts  = { unmatched: unmatched.length, pending: pending.length, assigned: assigned.length }
  const { emptyMsg } = TABS.find((t) => t.id === activeTab)!

  // 통계
  const totalSeniors   = unmatched.length + pending.length + assigned.length
  const assignedCount  = assigned.filter(({ matches }) => matches.some((m) => m.status === 'assigned')).length
  const doneCount      = assigned.filter(({ matches }) => matches.some((m) => m.status === 'done')).length
  const assignRate     = totalSeniors > 0 ? Math.round(((assignedCount + doneCount) / totalSeniors) * 100) : 0

  const rows = allRows.filter(({ senior }) => {
    const q = search.toLowerCase()
    if (q && !senior.name.toLowerCase().includes(q) && !(senior.phone ?? '').includes(q)) return false
    if (filterReg && senior.region !== filterReg) return false
    if (filterJob && senior.desired_job !== filterJob) return false
    return true
  })

  function openPanel(seniorId: string, type: Panel) {
    if (expandedId === seniorId && panelType === type) { setExpandedId(null); setPanelType(null) }
    else { setExpandedId(seniorId); setPanelType(type) }
  }
  function closePanel() { setExpandedId(null); setPanelType(null) }

  function handleAssign(matchId: string) {
    setActionId(matchId)
    startTransition(async () => { await assignMatch(matchId); setActionId(null); closePanel() })
  }
  function handleUnassign(matchId: string) {
    setActionId(matchId)
    startTransition(async () => { await unassignMatch(matchId); setActionId(null) })
  }
  function handleComplete(matchId: string) {
    setActionId(matchId)
    startTransition(async () => { await completeMatch(matchId); setActionId(null) })
  }
  function handleDelete(seniorId: string) {
    setDeletingId(seniorId)
    startTransition(async () => { await deleteSenior(seniorId); setDeletingId(null) })
  }

  const hasFilter = search || filterReg || filterJob

  return (
    <>
      {/* 통계 배너 */}
      <div className="grid grid-cols-4 gap-3 mb-6 bg-white rounded-2xl border border-gray-200 p-5">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">전체 시니어</p>
          <p className="text-3xl font-bold">{totalSeniors}<span className="text-base font-normal text-gray-400 ml-1">명</span></p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">배정 완료</p>
          <p className="text-3xl font-bold text-green-600">{assignedCount}<span className="text-base font-normal text-gray-400 ml-1">명</span></p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">취업 완료</p>
          <p className="text-3xl font-bold text-emerald-600">{doneCount}<span className="text-base font-normal text-gray-400 ml-1">명</span></p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">배정률</p>
          <p className="text-3xl font-bold text-blue-600">{assignRate}<span className="text-base font-normal text-gray-400 ml-1">%</span></p>
        </div>
      </div>

      {/* 탭 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); closePanel(); setSearch(''); setFilterReg(''); setFilterJob('') }}
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

      {/* 검색/필터 */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 연락처 검색"
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <select value={filterReg} onChange={(e) => setFilterReg(e.target.value)}
          className="h-11 rounded-xl border border-gray-300 px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
          <option value="">전체 지역</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterJob} onChange={(e) => setFilterJob(e.target.value)}
          className="h-11 rounded-xl border border-gray-300 px-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
          <option value="">전체 직종</option>
          {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
        </select>
        {hasFilter && (
          <button onClick={() => { setSearch(''); setFilterReg(''); setFilterJob('') }}
            className="h-11 px-4 rounded-xl border border-gray-300 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
            초기화
          </button>
        )}
      </div>

      {/* 시니어 목록 */}
      {rows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-xl text-gray-400">
            {hasFilter ? '검색 결과가 없습니다.' : emptyMsg}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-sm font-semibold">이름</th>
                <th className="px-4 py-4 text-sm font-semibold">연락처</th>
                <th className="px-4 py-4 text-sm font-semibold">지역</th>
                <th className="px-4 py-4 text-sm font-semibold">희망 직종</th>
                <th className="px-4 py-4 text-sm font-semibold">최고 점수</th>
                <th className="px-4 py-4 text-sm font-semibold">
                  {activeTab === 'assigned' ? '배정 공고' : '상태'}
                </th>
                <th className="px-4 py-4 text-sm font-semibold">상세</th>
                <th className="px-4 py-4 text-sm font-semibold">수정</th>
                <th className="px-4 py-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ senior, matches }) => {
                const topMatch      = matches[0]
                const topScore      = topMatch?.score ?? 0
                const topStatus     = topMatch?.status ?? 'pending'
                const isExpanded    = expandedId === senior.id
                const assignedMatch = matches.find((m) => m.status === 'assigned' || m.status === 'done')
                const isDeleting    = deletingId === senior.id

                return (
                  <React.Fragment key={senior.id}>
                    <tr className={`border-b border-gray-100 ${senior.memo ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-4 py-3 text-base font-semibold">
                        {senior.name}
                        {senior.memo && (
                          <span className="ml-1 text-xs text-yellow-600" title={senior.memo}>📝</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {senior.phone ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-base">{senior.region}</td>
                      <td className="px-4 py-3 text-base">{senior.desired_job}</td>
                      <td className="px-4 py-3">
                        {topScore > 0 ? (
                          <span className={`text-base font-bold px-2 py-1 rounded-lg ${scoreBadgeClass(topScore)}`}>
                            {topScore}점
                          </span>
                        ) : <span className="text-sm text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {activeTab === 'assigned' ? (
                          <div>
                            <p className="text-sm font-medium text-gray-800">{assignedMatch?.jobs.title ?? '—'}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${matchStatusBadge(assignedMatch?.status ?? '')}`}>
                              {matchStatusLabel(assignedMatch?.status ?? '')}
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            activeTab === 'unmatched' ? 'bg-gray-100 text-gray-500' : matchStatusBadge(topStatus)
                          }`}>
                            {activeTab === 'unmatched' ? '미매칭' : matchStatusLabel(topStatus)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/recommendations?senior_id=${senior.id}`}
                          className="inline-flex h-9 items-center px-3 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
                        >
                          상세
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openPanel(senior.id, 'edit')}
                          className={`h-9 px-3 rounded-lg text-sm font-semibold transition-colors border ${
                            isExpanded && panelType === 'edit'
                              ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                              : 'border-gray-300 text-gray-700 hover:border-gray-900'
                          }`}
                        >
                          수정
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {activeTab === 'pending' && (
                            <button
                              onClick={() => openPanel(senior.id, 'assign')}
                              className={`h-9 px-3 rounded-lg text-sm font-semibold transition-colors ${
                                isExpanded && panelType === 'assign'
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-gray-900 text-white hover:bg-gray-700'
                              }`}
                            >
                              {isExpanded && panelType === 'assign' ? '닫기 ▲' : '공고 선택 ▼'}
                            </button>
                          )}
                          {activeTab === 'assigned' && assignedMatch && (
                            <>
                              {assignedMatch.status === 'assigned' && (
                                <>
                                  <button
                                    onClick={() => handleComplete(assignedMatch.id)}
                                    disabled={isPending}
                                    className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                  >
                                    {actionId === assignedMatch.id ? '처리 중…' : '취업 완료'}
                                  </button>
                                  <button
                                    onClick={() => handleUnassign(assignedMatch.id)}
                                    disabled={isPending}
                                    className="h-9 px-3 rounded-lg border border-orange-400 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
                                  >
                                    {actionId === assignedMatch.id ? '처리 중…' : '배정 취소'}
                                  </button>
                                </>
                              )}
                            </>
                          )}
                          {activeTab === 'unmatched' && (
                            <button
                              onClick={() => handleDelete(senior.id)}
                              disabled={isDeleting || isPending}
                              className="h-9 px-3 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {isDeleting ? '삭제 중…' : '삭제'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* 공고 배정 패널 */}
                    {activeTab === 'pending' && isExpanded && panelType === 'assign' && (
                      <tr className="bg-blue-50 border-b border-blue-100">
                        <td colSpan={9} className="px-8 py-5">
                          <p className="text-base font-semibold text-blue-800 mb-3">
                            {senior.name} 님 — 배정할 공고를 선택하세요
                          </p>
                          <div className="flex flex-col gap-2">
                            {matches.map((match) => (
                              <div key={match.id}
                                className="flex items-center justify-between bg-white rounded-xl border border-blue-200 px-5 py-3">
                                <div className="flex items-center gap-4">
                                  <span className={`text-base font-bold px-3 py-1 rounded-lg ${scoreBadgeClass(match.score)}`}>
                                    {match.score}점
                                  </span>
                                  <div>
                                    <p className="text-base font-semibold">{match.jobs.title}</p>
                                    <p className="text-sm text-gray-500">
                                      {match.jobs.region} · {match.jobs.job_type} · 최소 {match.jobs.required_career}년
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssign(match.id)}
                                  disabled={isPending}
                                  className="h-10 px-5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                  {actionId === match.id ? '처리 중…' : '배정'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* 시니어 수정 패널 */}
                    {isExpanded && panelType === 'edit' && (
                      <EditPanel senior={senior} onClose={closePanel} />
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
