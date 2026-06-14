'use client';

import { useEffect, useRef, useState } from 'react';
import { signOutAction } from '@/lib/authActions';

interface Props {
  user: { name: string | null; email: string | null };
}

function initials(user: Props['user']): string {
  const source = user.name || user.email || '?';
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function UserMenuDropdown({ user }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full p-0.5 hover:bg-gray-100 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
          {initials(user)}
        </span>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-gray-500" aria-hidden>
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
        >
          <div className="px-4 py-3">
            {user.name && <p className="text-sm font-semibold text-gray-900">{user.name}</p>}
            {user.email && <p className="truncate text-xs text-gray-500">{user.email}</p>}
          </div>
          <div className="border-t border-gray-100" />
          <form action={signOutAction}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <span aria-hidden>⎋</span> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
