'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Read' },
  { href: '/test', label: 'Test' },
  { href: '/settings', label: 'Settings' },
];

interface Props {
  // Vertical, full-width rows for the mobile menu; horizontal pills (default) for the bar.
  vertical?: boolean;
  // Called on link click — used to close the mobile menu after navigating.
  onNavigate?: () => void;
}

// Top-bar primary navigation. /test and /settings are standalone routes.
export default function NavLinks({ vertical = false, onNavigate }: Props) {
  const pathname = usePathname();
  return (
    <nav className={vertical ? 'flex flex-col gap-1' : 'flex items-center gap-1'}>
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`text-sm font-medium transition-colors ${
              vertical ? 'rounded-lg px-3 py-2' : 'rounded-full px-3 py-1.5'
            } ${active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
