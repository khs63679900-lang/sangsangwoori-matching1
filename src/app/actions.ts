'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export type ProfileFormState = { success?: boolean; seniorId?: string; errors?: Record<string, string> }
export type DeleteSeniorState = { success?: boolean }
export type JobFormState = { success?: boolean; errors?: Record<string, string> }
export type LoginState = { error: string }
export type UpdateSeniorState = { success?: boolean; errors?: Record<string, string> }

type SeniorData = { id: string; region: string; desired_job: string; career_years: number }
type JobData = { id: string; region: string; job_type: string; required_career: number }

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── 인증 ────────────────────────────────────────────────────────────────────

export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get('password') ?? '')
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: '비밀번호가 올바르지 않습니다.' }
  }
  const jar = await cookies()
  jar.set('admin_session', password, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
  redirect('/admin')
}

export async function adminLogout() {
  const jar = await cookies()
  jar.delete('admin_session')
  redirect('/admin/login')
}

// ── 매칭 점수 계산 ──────────────────────────────────────────────────────────

const REGION_NORM: Record<string, string> = {
  '서울특별시': '서울',
  '경기도':     '경기',
  '인천광역시': '인천',
}
const JOB_NORM: Record<string, string> = {
  '경비직': '경비',
  '청소직': '청소',
  '조리직': '조리',
  '돌봄직': '돌봄',
}
function norm(v: string, map: Record<string, string>): string {
  return map[v] ?? v
}

function calcScore(
  senior: { region: string; desired_job: string; career_years: number },
  job: { region: string; job_type: string; required_career: number },
): number {
  const regionMatch = norm(senior.region, REGION_NORM) === norm(job.region, REGION_NORM)
  const jobMatch    = norm(senior.desired_job, JOB_NORM) === norm(job.job_type, JOB_NORM)
  const careerMatch = senior.career_years >= job.required_career
  return (regionMatch ? 3 : 0) + (jobMatch ? 2 : 0) + (careerMatch ? 1 : 0)
}

async function rematchSenior(db: SupabaseClient, senior: SeniorData) {
  await db.from('matches').delete().eq('senior_id', senior.id)
  const { data: jobs } = await db.from('jobs').select('*').eq('is_active', true)
  if (!jobs?.length) return

  const rows = (jobs as JobData[])
    .map((job) => ({ senior_id: senior.id, job_id: job.id, score: calcScore(senior, job), status: 'pending' }))
    .filter((r) => r.score > 0)
  if (rows.length > 0) await db.from('matches').insert(rows)
}

async function rematchJob(db: SupabaseClient, job: JobData) {
  await db.from('matches').delete().eq('job_id', job.id)
  const { data: seniors } = await db.from('seniors').select('*')
  if (!seniors?.length) return

  const rows = (seniors as SeniorData[])
    .map((s) => ({ senior_id: s.id, job_id: job.id, score: calcScore(s, job), status: 'pending' }))
    .filter((r) => r.score > 0)
  if (rows.length > 0) await db.from('matches').insert(rows)
}

// ── 시니어 ──────────────────────────────────────────────────────────────────

export async function saveSeniorProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const name         = String(formData.get('name')         ?? '').trim()
  const region       = String(formData.get('region')       ?? '').trim()
  const desired_job  = String(formData.get('desired_job')  ?? '').trim()
  const career_years = parseInt(String(formData.get('career_years') ?? '0'), 10)
  const salaryRaw    = parseInt(String(formData.get('desired_salary') ?? '0'), 10)
  const desired_salary = salaryRaw > 0 ? salaryRaw : null
  const phone        = String(formData.get('phone')        ?? '').trim() || null

  const errors: Record<string, string> = {}
  if (!name)        errors.name        = '이름을 입력해 주세요.'
  if (!region)      errors.region      = '지역을 선택해 주세요.'
  if (!desired_job) errors.desired_job = '희망 직종을 선택해 주세요.'
  if (Object.keys(errors).length > 0) return { errors }

  const db = getClient()
  const { data, error } = await db.rpc('insert_senior', {
    p_name:           name,
    p_region:         region,
    p_desired_job:    desired_job,
    p_career_years:   career_years,
    p_desired_salary: desired_salary ?? 0,
    p_phone:          phone ?? '',
  })
  const senior = Array.isArray(data) ? data[0] : data
  if (error || !senior) return { errors: { _form: error?.message ?? '저장에 실패했습니다.' } }

  await rematchSenior(db, senior as SeniorData)
  revalidatePath('/admin')
  return { success: true, seniorId: senior.id }
}

export async function updateSenior(
  _prev: UpdateSeniorState,
  formData: FormData
): Promise<UpdateSeniorState> {
  const id           = String(formData.get('id')           ?? '').trim()
  const name         = String(formData.get('name')         ?? '').trim()
  const region       = String(formData.get('region')       ?? '').trim()
  const desired_job  = String(formData.get('desired_job')  ?? '').trim()
  const career_years = parseInt(String(formData.get('career_years') ?? '0'), 10)
  const salaryRaw    = parseInt(String(formData.get('desired_salary') ?? '0'), 10)
  const desired_salary = salaryRaw > 0 ? salaryRaw : null
  const phone        = String(formData.get('phone')        ?? '').trim() || null
  const memo         = String(formData.get('memo')         ?? '').trim() || null

  const errors: Record<string, string> = {}
  if (!name)        errors.name        = '이름을 입력해 주세요.'
  if (!region)      errors.region      = '지역을 선택해 주세요.'
  if (!desired_job) errors.desired_job = '희망 직종을 선택해 주세요.'
  if (Object.keys(errors).length > 0) return { errors }

  const db = getClient()
  const { error } = await db.rpc('update_senior', {
    p_id:             id,
    p_name:           name,
    p_region:         region,
    p_desired_job:    desired_job,
    p_career_years:   career_years,
    p_desired_salary: desired_salary ?? 0,
    p_phone:          phone ?? '',
    p_memo:           memo ?? '',
  })
  if (error) return { errors: { _form: error.message } }

  await rematchSenior(db, { id, region, desired_job, career_years })
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteSenior(seniorId: string) {
  const db = getClient()
  await db.from('matches').delete().eq('senior_id', seniorId)
  await db.from('seniors').delete().eq('id', seniorId)
  revalidatePath('/admin')
}

// ── 매칭 ────────────────────────────────────────────────────────────────────

export async function assignMatch(matchId: string) {
  const db = getClient()
  await db.from('matches').update({ status: 'assigned' }).eq('id', matchId)
  revalidatePath('/admin')
}

export async function unassignMatch(matchId: string) {
  const db = getClient()
  await db.from('matches').update({ status: 'pending' }).eq('id', matchId)
  revalidatePath('/admin')
}

export async function completeMatch(matchId: string) {
  const db = getClient()
  await db.from('matches').update({ status: 'done' }).eq('id', matchId)
  revalidatePath('/admin')
}

// ── 일자리 ──────────────────────────────────────────────────────────────────

export async function addJob(
  _prev: JobFormState,
  formData: FormData
): Promise<JobFormState> {
  const title           = String(formData.get('title')           ?? '').trim()
  const region          = String(formData.get('region')          ?? '').trim()
  const job_type        = String(formData.get('job_type')        ?? '').trim()
  const required_career = parseInt(String(formData.get('required_career') ?? '0'), 10)
  const memo            = String(formData.get('memo')            ?? '').trim() || null

  const errors: Record<string, string> = {}
  if (!title)    errors.title    = '공고명을 입력해 주세요.'
  if (!region)   errors.region   = '지역을 선택해 주세요.'
  if (!job_type) errors.job_type = '직종을 선택해 주세요.'
  if (Object.keys(errors).length > 0) return { errors }

  const db = getClient()
  const { data: job, error } = await db
    .from('jobs')
    .insert({ title, region, job_type, required_career, memo, is_active: true })
    .select()
    .single()
  if (error || !job) return { errors: { _form: error?.message ?? '저장에 실패했습니다.' } }

  await rematchJob(db, job as JobData)
  revalidatePath('/admin')
  return { success: true }
}

export async function toggleJobActive(jobId: string, currentActive: boolean) {
  const db = getClient()
  await db.from('jobs').update({ is_active: !currentActive }).eq('id', jobId)
  if (!currentActive) {
    const { data: job } = await db.from('jobs').select('*').eq('id', jobId).single()
    if (job) await rematchJob(db, job as JobData)
  } else {
    await db.from('matches').delete().eq('job_id', jobId).eq('status', 'pending')
  }
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
    { title: '강남 아파트 경비원',    region: '서울', job_type: '경비', required_career: 0 },
    { title: '서울 요양원 돌봄 보조', region: '서울', job_type: '돌봄', required_career: 1 },
    { title: '수원 아파트 경비원',    region: '경기', job_type: '경비', required_career: 0 },
    { title: '경기 노인 돌봄 서비스', region: '경기', job_type: '돌봄', required_career: 2 },
    { title: '인천 병원 조리 보조',   region: '인천', job_type: '조리', required_career: 1 },
    { title: '인천 물류센터 청소',    region: '인천', job_type: '청소', required_career: 0 },
  ]

  for (const jobData of sampleJobs) {
    const { data: job } = await db.from('jobs').insert(jobData).select().single()
    if (job) await rematchJob(db, job as JobData)
  }

  revalidatePath('/admin')
}
