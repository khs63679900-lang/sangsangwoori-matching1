import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
      <h1 className="text-4xl font-bold">상상우리</h1>
      <p className="text-xl text-gray-600">시니어와 일자리를 자동으로 연결합니다</p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="text-lg h-14 px-8">
          <Link href="/register">프로필 등록하기</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="text-lg h-14 px-8">
          <Link href="/admin">담당자 대시보드</Link>
        </Button>
      </div>
    </div>
  )
}
