import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: '상상우리 — 시니어 일자리 매칭',
  description: '시니어와 일자리를 자동으로 매칭하는 서비스',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 text-lg">
        <Nav />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10">{children}</main>
      </body>
    </html>
  )
}
