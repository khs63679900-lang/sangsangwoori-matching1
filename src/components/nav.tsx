import Link from 'next/link'

const links = [
  { href: '/register', label: '프로필 등록' },
  { href: '/recommendations', label: '추천 목록' },
  { href: '/admin', label: '담당자 대시보드' },
]

export function Nav() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-row items-center justify-between gap-2">
        <span className="text-xl font-bold tracking-tight shrink-0">상상우리</span>
        <ul className="flex flex-wrap gap-1 justify-end">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium whitespace-nowrap"
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
