'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavLinks from './NavLinks';
import { VocabSheetPill } from '@/modules/vocab-store';

interface Props {
  // The session-aware UserMenu (a server component) is rendered by the parent and slotted in
  // here, so this client component can own the responsive mobile-menu state.
  userMenu: React.ReactNode;
}

// App bar. On sm+ the nav links and sheet control sit inline; on mobile they collapse into a
// hamburger menu so everything fits. The account avatar (userMenu) stays in the bar at all sizes.
export default function TopBarClient({ userMenu }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  // Close the menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Close on outside click / Escape (matches UserMenuDropdown).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header
      ref={ref}
      className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              F
            </span>
            <span className="hidden font-semibold text-gray-900 sm:inline">
              Finnish <span className="text-indigo-600">Learner</span>
            </span>
          </Link>
          <div className="hidden sm:block">
            <NavLinks />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <VocabSheetPill />
          </div>
          {userMenu}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 sm:hidden"
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-200 bg-white sm:hidden">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
            <NavLinks vertical onNavigate={() => setOpen(false)} />
            <div className="border-t border-gray-100 pt-3">
              <VocabSheetPill />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
