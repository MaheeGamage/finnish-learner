import Link from 'next/link';
import NavLinks from './NavLinks';
import UserMenu from './UserMenu';
import { VocabSheetPill } from '@/modules/vocab-store';

// Full-width sticky app bar. Replaces the old floating top-right nav (which overlapped
// the page title on mobile) — being a real bar in normal flow, content sits below it.
export default function TopBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur">
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
          <NavLinks />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <VocabSheetPill />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
