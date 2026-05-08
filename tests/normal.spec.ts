/**
 * 정상 시나리오
 * 사전조건: 서울/경비/요구경력 3년 공고 1건
 * 시니어:  서울/경비/5년 → 점수 = 지역(+3) + 직종(+2) + 경력(+1) = 6점
 * 기대:    성공 박스 → 추천 페이지 → 6점 금색 배지
 */
import { test, expect } from '@playwright/test'
import { clearAll, getDb } from './helpers/db'

test.beforeEach(async () => {
  await clearAll()
  const db = getDb()
  await db.from('jobs').insert({
    title: '테스트 경비 공고',
    region: '서울',
    job_type: '경비',
    required_career: 3,
  })
})

test('시니어 등록 → 6점 매칭 카드 표시', async ({ page }) => {
  await page.goto('/register')

  await page.fill('#name', '테스트시니어')
  await page.selectOption('#region', '서울')
  await page.selectOption('#desired_job', '경비')
  await page.locator('#career_years').fill('5')

  await page.getByRole('button', { name: '등록하기' }).click()

  // 성공 박스
  await expect(page.getByText('등록이 완료되었습니다')).toBeVisible()

  // 추천 일자리 보기 이동
  await page.getByRole('link', { name: /추천 일자리 보기/ }).click()
  await expect(page).toHaveURL(/\/recommendations\?senior_id=/)

  // 6점 배지 확인 (amber/금색)
  await expect(page.getByText('6점')).toBeVisible()
})
