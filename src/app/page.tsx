import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
      <h1 className="text-4xl font-bold">상상우리</h1>
      <p className="text-xl text-gray-600">시니어와 일자리를 자동으로 연결합니다</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "text-lg h-14 px-8")}>
          프로필 등록하기
        </Link>
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-lg h-14 px-8")}>
          담당자 대시보드
        </Link>
      </div>
    </div>
  )
}
