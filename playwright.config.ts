import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

// .env.local → process.env 로드 (Next.js 외부에서 실행되는 Playwright 전용)
try {
  const raw = readFileSync(join(__dirname, '.env.local'), 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !process.env[key]) process.env[key] = val
  }
} catch {
  // CI 등 .env.local 없는 환경은 기존 process.env 사용
}

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  workers: 1, // DB 공유 → 직렬 실행
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // 이미 실행 중이면 재사용
    timeout: 120_000,
  },
})
