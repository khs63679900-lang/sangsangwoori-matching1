import Link from 'next/link'

const links = [
  { href: '/register', label: '프로필 등록' },
  { href: '/recommendations', label: '추천 목록' },
  { href: '/admin', label: '담당자 대시보드' },
]

export function Nav() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <span className="text-2xl font-bold tracking-tight">상상우리</span>
        <ul className="flex flex-wrap gap-2 sm:ml-8">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-lg px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
