'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Read' },
  { href: '/test', label: 'Test' },
  { href: '/settings', label: 'Settings' },
];

// Top-bar primary navigation. /test is a standalone route (Vocab Test works without the Reader).
export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
