/**
 * 실패 시나리오
 * 이름 미입력 제출 → 빨간 안내 박스 / seniors 테이블 미저장
 */
import { test, expect } from '@playwright/test'
import { clearAll, getDb } from './helpers/db'

test.beforeEach(async () => {
  await clearAll()
})

test('이름 미입력 → 빨간 안내 박스 / seniors 미저장', async ({ page }) => {
  const db = getDb()
  const { count: before } = await db
    .from('seniors')
    .select('*', { count: 'exact', head: true })

  await page.goto('/register')

  // 이름 비워두고 나머지만 입력
  await page.selectOption('#region', '서울')
  await page.selectOption('#desired_job', '경비')
  await page.locator('#career_years').fill('3')

  await page.getByRole('button', { name: '등록하기' }).click()

  // 빨간 안내 박스
  await expect(page.getByText('이름을 입력해 주세요.')).toBeVisible()

  // 성공 박스 없음 확인
  await expect(page.getByText('등록이 완료되었습니다')).not.toBeVisible()

  // DB 미저장 확인
  const { count: after } = await db
    .from('seniors')
    .select('*', { count: 'exact', head: true })
  expect(after).toBe(before ?? 0)
})
