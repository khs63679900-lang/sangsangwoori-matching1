'use server'

import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 지역 일치 +50 / 직종 일치 +30 / 경력 충족 +20
function calcScore(
  senior: { region: string; desired_job: string; career_years: number },
  job: { region: string; job_type: string; required_career: number }
): number {
  let score = 0
  if (senior.region === job.region) score += 50
  if (senior.desired_job === job.job_type) score += 30
  if (senior.career_years >= job.required_career) score += 20
  return score
}

export async function registerSenior(formData: FormData) {
  const db = getClient()

  const payload = {
    name: String(formData.get('name') ?? ''),
    region: String(formData.get('region') ?? ''),
    desired_job: String(formData.get('desired_job') ?? ''),
    career_years: parseInt(String(formData.get('career_years') ?? '0'), 10),
  }

  const { data: senior, error } = await db
    .from('seniors')
    .insert(payload)
    .select()
    .single()

  if (error || !senior) throw new Error(error?.message ?? 'senior insert failed')

  const { data: jobs } = await db.from('jobs').select('*')

  if (jobs && jobs.length > 0) {
    const rows = jobs
      .map((job) => ({
        senior_id: senior.id,
        job_id: job.id,
        score: calcScore(senior, job),
        status: 'pending',
      }))
      .filter((r) => r.score > 0)

    if (rows.length > 0) {
      await db.from('matches').insert(rows)
    }
  }

  redirect(`/recommendations?senior_id=${senior.id}`)
}

export async function assignMatch(matchId: string) {
  const db = getClient()
  await db.from('matches').update({ status: 'assigned' }).eq('id', matchId)
  revalidatePath('/admin')
}

export async function seedSampleJobs() {
  const db = getClient()
  const { count } = await db.from('jobs').select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return  // 이미 데이터 있으면 건너뜀

  await db.from('jobs').insert([
    { title: '강남구 아파트 경비', region: '서울 강남구', job_type: '경비', required_career: 0 },
    { title: '강남구 사무보조 (사무직)', region: '서울 강남구', job_type: '사무보조', required_career: 2 },
    { title: '종로구 빌딩 경비', region: '서울 종로구', job_type: '경비', required_career: 1 },
    { title: '해운대구 리조트 청소', region: '부산 해운대구', job_type: '청소', required_career: 0 },
    { title: '남동구 물류센터 보조', region: '인천 남동구', job_type: '사무보조', required_career: 3 },
    { title: '수원 영통구 아파트 경비', region: '경기 수원시', job_type: '경비', required_career: 0 },
  ])

  revalidatePath('/admin')
}
