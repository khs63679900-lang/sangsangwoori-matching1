'use client'

import { useState, useActionState, useTransition, useEffect } from 'react'
import { addJob, deleteJob, toggleJobActive, type JobFormState } from '@/app/actions'

type Job = {
  id: string; title: string; region: string; job_type: string
  required_career: number; is_active: boolean; memo?: string | null
}

const REGIONS   = ['서울', '경기', '인천', '기타'] as const
const JOB_TYPES = ['경비', '청소', '조리', '돌봄', '기타'] as const

const INITIAL: JobFormState = {}

export function JobManagement({ jobs }: { jobs: Job[] }) {
  const [state, formAction, isPending] = useActionState(addJob, INITIAL)
  const [isActing, startTransition]    = useTransition()
  const [actingId, setActingId]        = useState<string | null>(null)
  const [region, setRegion]            = useState('')
  const [jobType, setJobType]          = useState('')

  useEffect(() => {
    if (state.success) { setRegion(''); setJobType('') }
  }, [state.success])

  function handleDelete(jobId: string) {
    setActingId(jobId + ':del')
    startTransition(async () => { await deleteJob(jobId); setActingId(null) })
  }

  function handleToggle(jobId: string, currentActive: boolean) {
    setActingId(jobId + ':toggle')
    startTransition(async () => { await toggleJobActive(jobId, currentActive); setActingId(null) })
  }

  const activeJobs   = jobs.filter((j) => j.is_active)
  const inactiveJobs = jobs.filter((j) => !j.is_active)

  return (
    <section className="mt-16">
      <h2 className="text-3xl font-bold mb-8">일자리 관리</h2>

      {/* 일자리 추가 폼 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
        <h3 className="text-2xl font-semibold mb-6">새 일자리 등록</h3>

        {state.success && (
          <div className="bg-green-50 border border-green-400 rounded-xl px-4 py-3 mb-6">
            <p className="text-green-700 font-semibold text-lg">일자리가 등록되었습니다.</p>
          </div>
        )}
        {state.errors?._form && (
          <div className="bg-red-50 border border-red-400 rounded-xl px-4 py-3 mb-6">
            <p className="text-red-700 font-semibold">{state.errors._form}</p>
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="job-title" className="text-xl font-semibold">
              공고명 <span className="text-red-500">*</span>
            </label>
            {state.errors?.title && (
              <p className="text-red-700 font-semibold text-base">{state.errors.title}</p>
            )}
            <input id="job-title" name="title" type="text" placeholder="강남구 아파트 경비원"
              className="h-14 rounded-xl border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="job-region" className="text-xl font-semibold">지역 <span className="text-red-500">*</span></label>
              {state.errors?.region && <p className="text-red-700 text-base font-semibold">{state.errors.region}</p>}
              <select id="job-region" name="region" value={region} onChange={(e) => setRegion(e.target.value)}
                className="h-14 rounded-xl border border-gray-300 px-4 text-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">지역 선택</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="job-type" className="text-xl font-semibold">직종 <span className="text-red-500">*</span></label>
              {state.errors?.job_type && <p className="text-red-700 text-base font-semibold">{state.errors.job_type}</p>}
              <select id="job-type" name="job_type" value={jobType} onChange={(e) => setJobType(e.target.value)}
                className="h-14 rounded-xl border border-gray-300 px-4 text-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">직종 선택</option>
                {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="required-career" className="text-xl font-semibold">요구 경력 (년)</label>
            <input id="required-career" name="required_career" type="number" min="0" defaultValue="0"
              className="h-14 rounded-xl border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="job-memo" className="text-xl font-semibold">메모 (선택)</label>
            <textarea id="job-memo" name="memo" rows={2} placeholder="급여 조건, 근무 시간 등 추가 정보"
              className="rounded-xl border border-gray-300 px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
          </div>

          <button type="submit" disabled={isPending}
            className="h-14 rounded-xl bg-gray-900 text-white text-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? '등록 중…' : '일자리 등록'}
          </button>
        </form>
      </div>

      {/* 일자리 목록 */}
      <JobTable
        title={`활성 공고 (${activeJobs.length}개)`}
        jobs={activeJobs}
        actingId={actingId}
        isActing={isActing}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {inactiveJobs.length > 0 && (
        <div className="mt-6">
          <JobTable
            title={`마감 공고 (${inactiveJobs.length}개)`}
            jobs={inactiveJobs}
            actingId={actingId}
            isActing={isActing}
            onToggle={handleToggle}
            onDelete={handleDelete}
            muted
          />
        </div>
      )}
    </section>
  )
}

function JobTable({
  title, jobs, actingId, isActing, onToggle, onDelete, muted = false,
}: {
  title: string
  jobs: Job[]
  actingId: string | null
  isActing: boolean
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
  muted?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className={`text-2xl font-semibold ${muted ? 'text-gray-400' : ''}`}>{title}</h3>
      </div>
      {jobs.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-xl text-gray-400">없음</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-4 text-base font-semibold">공고명</th>
              <th className="px-5 py-4 text-base font-semibold">지역</th>
              <th className="px-5 py-4 text-base font-semibold">직종</th>
              <th className="px-5 py-4 text-base font-semibold">요구 경력</th>
              <th className="px-5 py-4 text-base font-semibold">메모</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className={`border-b border-gray-100 last:border-0 ${muted ? 'opacity-60' : ''}`}>
                <td className="px-5 py-4 text-base font-medium">
                  {job.title}
                  {!job.is_active && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">마감</span>
                  )}
                </td>
                <td className="px-5 py-4 text-base">{job.region}</td>
                <td className="px-5 py-4 text-base">{job.job_type}</td>
                <td className="px-5 py-4 text-base">{job.required_career}년 이상</td>
                <td className="px-5 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                  {job.memo ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggle(job.id, job.is_active)}
                      disabled={isActing && actingId === job.id + ':toggle'}
                      className={`h-10 px-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
                        job.is_active
                          ? 'border border-orange-400 text-orange-600 hover:bg-orange-50'
                          : 'border border-green-500 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {actingId === job.id + ':toggle' ? '처리 중…' : job.is_active ? '마감' : '재활성화'}
                    </button>
                    <button
                      onClick={() => onDelete(job.id)}
                      disabled={isActing && actingId === job.id + ':del'}
                      className="h-10 px-4 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actingId === job.id + ':del' ? '삭제 중…' : '삭제'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
