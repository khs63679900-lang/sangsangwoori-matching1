'use client'

import { useActionState } from 'react'
import { adminLogin } from '@/app/actions'

const INITIAL = { error: '' }

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(adminLogin, INITIAL)

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-3xl font-bold mb-2 text-center">담당자 로그인</h1>
      <p className="text-center text-gray-500 mb-8">관리자 비밀번호를 입력하세요</p>

      <form action={formAction} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-5">
        {state.error && (
          <div className="bg-red-50 border border-red-400 rounded-xl px-4 py-3">
            <p className="text-red-700 font-semibold">{state.error}</p>
          </div>
        )}
        <input
          name="password"
          type="password"
          placeholder="비밀번호"
          autoFocus
          className="h-14 rounded-xl border-2 border-gray-300 px-4 text-xl focus:outline-none focus:border-gray-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-14 rounded-xl bg-gray-900 text-white text-xl font-bold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? '확인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
