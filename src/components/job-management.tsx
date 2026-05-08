'use client'

import { useState, useActionState, useTransition, useEffect } from 'react'
import { addJob, deleteJob, type JobFormState } from '@/app/actions'

type Job = { id: string; title: string; region: string; job_type: string; required_career: number }

const REGIONS = ['서울', '경기', '인천', '기타'] as const
const JOB_TYPES = ['경비', '청소', '조리', '돌봄', '기타'] as const

const INITIAL: JobFormState = {}

export function JobManagement({ jobs }: { jobs: Job[] }) {
  const [state, formAction, isPending] = useActionState(addJob, INITIAL)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [region, setRegion] = useState('')
  const [jobType, setJobType] = useState('')

  useEffect(() => {
    if (state.success) {
      setRegion('')
      setJobType('')
    }
  }, [state.success])

  function handleDelete(jobId: string) {
    setDeletingId(jobId)
    startDeleteTransition(async () => {
      await deleteJob(jobId)
      setDeletingId(null)
    })
  }

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
          {/* 공고명 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="job-title" className="text-xl font-semibold">
              공고명 <span className="text-red-500">*</span>
            </label>
            {state.errors?.title && (
              <div className="bg-red-50 border border-red-400 rounded-xl px-4 py-3">
                <p className="text-red-700 font-semibold">{state.errors.title}</p>
              </div>
            )}
            <input
              id="job-title"
              name="title"
              type="text"
              placeholder="강남구 아파트 경비원"
              className="h-14 rounded-xl border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* 지역 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="job-region" className="text-xl font-semibold">
                지역 <span className="text-red-500">*</span>
              </label>
              {state.errors?.region && (
                <div className="bg-red-50 border border-red-400 rounded-xl px-3 py-2">
                  <p className="text-red-700 text-base font-semibold">{state.errors.region}</p>
                </div>
              )}
              <select
                id="job-region"
                name="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="h-14 rounded-xl border border-gray-300 px-4 text-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">지역 선택</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* 직종 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="job-type" className="text-xl font-semibold">
                직종 <span className="text-red-500">*</span>
              </label>
              {state.errors?.job_type && (
                <div className="bg-red-50 border border-red-400 rounded-xl px-3 py-2">
                  <p className="text-red-700 text-base font-semibold">{state.errors.job_type}</p>
                </div>
              )}
              <select
                id="job-type"
                name="job_type"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="h-14 rounded-xl border border-gray-300 px-4 text-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">직종 선택</option>
                {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
          </div>

          {/* 요구 경력 */}
          <div className="flex flex-col gap-2">
            <label htmlFor="required-career" className="text-xl font-semibold">요구 경력 (년)</label>
            <input
              id="required-career"
              name="required_career"
              type="number"
              min="0"
              defaultValue="0"
              className="h-14 rounded-xl border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-14 rounded-xl bg-gray-900 text-white text-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? '등록 중…' : '일자리 등록'}
          </button>
        </form>
      </div>

      {/* 일자리 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-2xl font-semibold">
            등록된 일자리{' '}
            <span className="text-gray-400 font-normal text-xl">({jobs.length}개)</span>
          </h3>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-400">등록된 일자리가 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 text-lg font-semibold">공고명</th>
                <th className="px-5 py-4 text-lg font-semibold">지역</th>
                <th className="px-5 py-4 text-lg font-semibold">직종</th>
                <th className="px-5 py-4 text-lg font-semibold">요구 경력</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const isThisDeleting = isDeleting && deletingId === job.id
                return (
                  <tr key={job.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-4 text-lg font-medium">{job.title}</td>
                    <td className="px-5 py-4 text-lg">{job.region}</td>
                    <td className="px-5 py-4 text-lg">{job.job_type}</td>
                    <td className="px-5 py-4 text-lg">{job.required_career}년 이상</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={isThisDeleting}
                        className="h-11 px-6 rounded-xl bg-red-600 text-white text-base font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isThisDeleting ? '삭제 중…' : '삭제'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
