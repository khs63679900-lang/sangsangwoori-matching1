import { registerSenior } from '@/app/actions'

export default function RegisterPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">시니어 프로필 등록</h1>
      <p className="text-lg text-gray-500 mb-8">
        기본 정보를 입력하시면 일자리를 자동으로 추천해 드립니다.
      </p>

      <form
        action={registerSenior}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-lg font-semibold">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="홍길동"
            required
            className="h-14 rounded-xl border border-gray-300 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="region" className="text-lg font-semibold">지역</label>
          <input
            id="region"
            name="region"
            type="text"
            placeholder="예: 서울 강남구"
            required
            className="h-14 rounded-xl border border-gray-300 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-sm text-gray-400">샘플 지역: 서울 강남구 / 서울 종로구 / 부산 해운대구 / 인천 남동구 / 경기 수원시</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="desired_job" className="text-lg font-semibold">희망 직종</label>
          <input
            id="desired_job"
            name="desired_job"
            type="text"
            placeholder="예: 경비"
            required
            className="h-14 rounded-xl border border-gray-300 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-sm text-gray-400">샘플 직종: 경비 / 청소 / 사무보조</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="career_years" className="text-lg font-semibold">경력 (년)</label>
          <input
            id="career_years"
            name="career_years"
            type="number"
            min="0"
            defaultValue="0"
            required
            className="h-14 rounded-xl border border-gray-300 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <button
          type="submit"
          className="h-16 rounded-xl bg-gray-900 text-white text-xl font-bold mt-2 hover:bg-gray-700 transition-colors"
        >
          등록하기
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-700 font-medium">
          매칭 점수 계산 방식: 지역 일치 +50점 · 직종 일치 +30점 · 경력 충족 +20점 (최대 100점)
        </p>
      </div>
    </div>
  )
}
