'use client';

import { useEffect, useState } from 'react';
import { getVocabSheetId } from '../sheetSettings';
import ConnectSheetModal from './ConnectSheetModal';

// Top-bar control for the user's vocabulary Google Sheet. Shows connection status and
// opens the connect modal. The sheet id lives in localStorage (per-user, client-side).
export default function VocabSheetPill() {
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSheetId(getVocabSheetId());
  }, []);

  const connected = Boolean(sheetId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={connected ? `Vocabulary sheet connected` : 'Connect a vocabulary sheet'}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span
          className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`}
          aria-hidden
        />
        {connected ? 'Sheet connected' : 'No sheet'}
      </button>

      <ConnectSheetModal
        open={open}
        currentSheetId={sheetId}
        onClose={() => setOpen(false)}
        onConnected={(id) => setSheetId(id)}
        onDisconnect={() => setSheetId(null)}
      />
    </>
  );
}
