'use client'

import { useState, useActionState } from 'react'
import { saveSeniorProfile, type ProfileFormState } from '@/app/actions'
import Link from 'next/link'

const REGIONS = ['서울', '경기', '인천', '기타'] as const
const JOB_TYPES = ['경비', '청소', '조리', '돌봄', '기타'] as const

const INITIAL: ProfileFormState = {}

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(saveSeniorProfile, INITIAL)
  const [region, setRegion] = useState('')
  const [desiredJob, setDesiredJob] = useState('')

  if (state.success) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-10 text-center">
          <p className="text-3xl font-bold text-green-700 mb-3">등록이 완료되었습니다</p>
          <p className="text-lg text-green-600 mb-8">매칭 점수가 계산되었습니다. 추천 일자리를 확인해 보세요.</p>
          <Link
            href={`/recommendations?senior_id=${state.seniorId}`}
            className="inline-block h-14 px-8 rounded-xl bg-gray-900 text-white text-xl font-bold leading-[3.5rem] hover:bg-gray-700 transition-colors"
          >
            추천 일자리 보기 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">시니어 프로필 등록</h1>
      <p className="text-lg text-gray-500 mb-8">
        기본 정보를 입력하시면 일자리를 추천해 드립니다.
      </p>

      <form
        action={formAction}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6"
      >
        {state.errors?._form && (
          <div className="bg-red-50 border border-red-400 rounded-xl px-4 py-3">
            <p className="text-red-700 font-semibold">{state.errors._form}</p>
          </div>
        )}

        {/* 이름 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-xl font-semibold">
            이름 <span className="text-red-500">*</span>
          </label>
          {state.errors?.name && (
            <div className="bg-red-50 border border-red-400 rounded-xl px-4 py-3">
              <p className="text-red-700 font-semibold">{state.errors.name}</p>
            </div>
          )}
          <input
            id="name"
            name="name"
            type="text"
            placeholder="홍길동"
            className="h-14 rounded-xl border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* 지역 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="region" className="text-xl font-semibold">
            지역 <span className="text-red-500">*</span>
          </label>
          {state.errors?.region && (
            <div className="bg-red-50 border border-red-400 rounded-xl px-4 py-3">
              <p className="text-red-700 font-semibold">{state.errors.region}</p>
            </div>
          )}
          <select
            id="region"
            name="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-14 rounded-xl border border-gray-300 px-4 text-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">지역을 선택하세요</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* 희망 직종 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="desired_job" className="text-xl font-semibold">
            희망 직종 <span className="text-red-500">*</span>
          </label>
          {state.errors?.desired_job && (
            <div className="bg-red-50 border border-red-400 rounded-xl px-4 py-3">
              <p className="text-red-700 font-semibold">{state.errors.desired_job}</p>
            </div>
          )}
          <select
            id="desired_job"
            name="desired_job"
            value={desiredJob}
            onChange={(e) => setDesiredJob(e.target.value)}
            className="h-14 rounded-xl border border-gray-300 px-4 text-xl bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">직종을 선택하세요</option>
            {JOB_TYPES.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {/* 경력 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="career_years" className="text-xl font-semibold">경력 (년)</label>
          <input
            id="career_years"
            name="career_years"
            type="number"
            min="0"
            defaultValue="0"
            className="h-14 rounded-xl border border-gray-300 px-4 text-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="h-16 rounded-xl bg-gray-900 text-white text-2xl font-bold mt-2 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? '등록 중…' : '등록하기'}
        </button>
      </form>
    </div>
  )
}
