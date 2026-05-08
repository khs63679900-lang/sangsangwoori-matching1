/**
 * 엣지 시나리오
 * 공고:  기타/기타/요구경력 99년  ← 지역·직종·경력 3항목 전부 불일치 보장
 * 시니어: 서울/경비/3년 → 점수 0 → matches 미삽입
 * 기대:  "현재 매칭되는 일자리가 없습니다" 안내 박스
 */
import { test, expect } from '@playwright/test'
import { clearAll, getDb } from './helpers/db'

test.beforeEach(async () => {
  await clearAll()
  const db = getDb()
  await db.from('jobs').insert({
    title: '매칭불가 테스트 공고',
    region: '기타',
    job_type: '기타',
    required_career: 99, // 경력 조건도 절대 충족 불가
  })
})

test('조건 전부 불일치 → 매칭 없음 안내 표시', async ({ page }) => {
  await page.goto('/register')

  await page.fill('#name', '노매칭시니어')
  await page.selectOption('#region', '서울')
  await page.selectOption('#desired_job', '경비')
  await page.locator('#career_years').fill('3')

  await page.getByRole('button', { name: '등록하기' }).click()

  await expect(page.getByText('등록이 완료되었습니다')).toBeVisible()

  await page.getByRole('link', { name: /추천 일자리 보기/ }).click()
  await expect(page).toHaveURL(/\/recommendations\?senior_id=/)

  await expect(page.getByText('현재 매칭되는 일자리가 없습니다')).toBeVisible()
})
