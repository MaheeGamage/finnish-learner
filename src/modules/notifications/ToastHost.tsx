'use client';

import { useEffect, useState } from 'react';
import { subscribe, dismiss, type Toast } from './toastStore';

const VARIANT_STYLES: Record<Toast['variant'], string> = {
  error: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
  info: 'bg-gray-800 text-white',
};

// Renders the toast stack. Mounted once in the root layout. Styling is intentionally
// minimal for now — refined in the connect-UX UI pass. Non-blocking: fixed overlay,
// dismissible, auto-hiding (handled by the store's ttl).
export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribe(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col items-end gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`w-fit max-w-full sm:max-w-sm flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm ${VARIANT_STYLES[toast.variant]}`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
