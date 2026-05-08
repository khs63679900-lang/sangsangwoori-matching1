'use server'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export type ProfileFormState = { success?: boolean; seniorId?: string; errors?: Record<string, string> }
export type JobFormState = { success?: boolean; errors?: Record<string, string> }

type SeniorData = { id: string; region: string; desired_job: string; career_years: number }
type JobData = { id: string; region: string; job_type: string; required_career: number }

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 지역 일치 +3 / 직종 일치 +2 / 경력 충족 +1 (최대 6점)
// 트리거 대신 앱 레이어에서 재계산
function calcScore(
  senior: { region: string; desired_job: string; career_years: number },
  job: { region: string; job_type: string; required_career: number },
  label?: string
): number {
  const regionMatch = senior.region === job.region
  const jobMatch = senior.desired_job === job.job_type
  const careerMatch = senior.career_years >= job.required_career

  const score = (regionMatch ? 3 : 0) + (jobMatch ? 2 : 0) + (careerMatch ? 1 : 0)

  console.log(
    `[매칭] ${label ?? ''}` +
    `\n  시니어: 지역=${senior.region}, 직종=${senior.desired_job}, 경력=${senior.career_years}년` +
    `\n  일자리: 지역=${job.region}, 직종=${job.job_type}, 요구경력=${job.required_career}년` +
    `\n  지역 일치(+3): ${regionMatch ? '✓' : '✗'}  직종 일치(+2): ${jobMatch ? '✓' : '✗'}  경력 충족(+1): ${careerMatch ? '✓' : '✗'}` +
    `\n  → 최종 점수: ${score}점`
  )

  return score
}

async function rematchSenior(db: SupabaseClient, senior: SeniorData & { name?: string }) {
  await db.from('matches').delete().eq('senior_id', senior.id)
  const { data: jobs } = await db.from('jobs').select('*')
  if (!jobs?.length) { console.log('[매칭] 등록된 일자리 없음 — 매칭 생략'); return }

  console.log(`\n=== 시니어 재매칭 시작: ${senior.name ?? senior.id} ===`)
  const rows = (jobs as (JobData & { title?: string })[])
    .map((job) => ({
      senior_id: senior.id,
      job_id: job.id,
      score: calcScore(senior, job, `vs [${job.title ?? job.id}]`),
      status: 'pending',
    }))
    .filter((r) => r.score > 0)
  console.log(`=== 저장될 매칭: ${rows.length}건 (0점 제외) ===\n`)

  if (rows.length > 0) await db.from('matches').insert(rows)
}

async function rematchJob(db: SupabaseClient, job: JobData & { title?: string }) {
  await db.from('matches').delete().eq('job_id', job.id)
  const { data: seniors } = await db.from('seniors').select('*')
  if (!seniors?.length) { console.log('[매칭] 등록된 시니어 없음 — 매칭 생략'); return }

  console.log(`\n=== 일자리 재매칭 시작: ${job.title ?? job.id} ===`)
  const rows = (seniors as (SeniorData & { name?: string })[])
    .map((s) => ({
      senior_id: s.id,
      job_id: job.id,
      score: calcScore(s, job, `[${s.name ?? s.id}] vs`),
      status: 'pending',
    }))
    .filter((r) => r.score > 0)
  console.log(`=== 저장될 매칭: ${rows.length}건 (0점 제외) ===\n`)

  if (rows.length > 0) await db.from('matches').insert(rows)
}

export async function saveSeniorProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const name = String(formData.get('name') ?? '').trim()
  const region = String(formData.get('region') ?? '').trim()
  const desired_job = String(formData.get('desired_job') ?? '').trim()
  const career_years = parseInt(String(formData.get('career_years') ?? '0'), 10)

  const errors: Record<string, string> = {}
  if (!name) errors.name = '이름을 입력해 주세요.'
  if (!region) errors.region = '지역을 선택해 주세요.'
  if (!desired_job) errors.desired_job = '희망 직종을 선택해 주세요.'
  if (Object.keys(errors).length > 0) return { errors }

  const db = getClient()
  const { data: senior, error } = await db
    .from('seniors')
    .insert({ name, region, desired_job, career_years })
    .select()
    .single()
  if (error || !senior) return { errors: { _form: error?.message ?? '저장에 실패했습니다.' } }

  await rematchSenior(db, senior as SeniorData)
  revalidatePath('/admin')
  return { success: true, seniorId: senior.id }
}

export async function addJob(
  _prev: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const title = String(formData.get('title') ?? '').trim()
  const region = String(formData.get('region') ?? '').trim()
  const job_type = String(formData.get('job_type') ?? '').trim()
  const required_career = parseInt(String(formData.get('required_career') ?? '0'), 10)

  const errors: Record<string, string> = {}
  if (!title) errors.title = '공고명을 입력해 주세요.'
  if (!region) errors.region = '지역을 선택해 주세요.'
  if (!job_type) errors.job_type = '직종을 선택해 주세요.'
  if (Object.keys(errors).length > 0) return { errors }

  const db = getClient()
  const { data: job, error } = await db
    .from('jobs')
    .insert({ title, region, job_type, required_career })
    .select()
    .single()
  if (error || !job) return { errors: { _form: error?.message ?? '저장에 실패했습니다.' } }

  await rematchJob(db, job as JobData)
  revalidatePath('/admin')
  return { success: true }
}

export async function assignMatch(matchId: string) {
  const db = getClient()
  await db.from('matches').update({ status: 'assigned' }).eq('id', matchId)
  revalidatePath('/admin')
}

export async function deleteJob(jobId: string) {
  const db = getClient()
  await db.from('matches').delete().eq('job_id', jobId)
  await db.from('jobs').delete().eq('id', jobId)
  revalidatePath('/admin')
}

export async function seedSampleJobs() {
  const db = getClient()
  const { count } = await db.from('jobs').select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 0) return

  const sampleJobs = [
    { title: '강남 아파트 경비원', region: '서울', job_type: '경비', required_career: 0 },
    { title: '서울 요양원 돌봄 보조', region: '서울', job_type: '돌봄', required_career: 1 },
    { title: '수원 아파트 경비원', region: '경기', job_type: '경비', required_career: 0 },
    { title: '경기 노인 돌봄 서비스', region: '경기', job_type: '돌봄', required_career: 2 },
    { title: '인천 병원 조리 보조', region: '인천', job_type: '조리', required_career: 1 },
    { title: '인천 물류센터 청소', region: '인천', job_type: '청소', required_career: 0 },
  ]

  for (const jobData of sampleJobs) {
    const { data: job } = await db.from('jobs').insert(jobData).select().single()
    if (job) await rematchJob(db, job as JobData)
  }

  revalidatePath('/admin')
}
