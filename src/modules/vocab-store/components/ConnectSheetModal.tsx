'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { parseSpreadsheetId, saveVocabSheetId, clearVocabSheetId } from '../sheetSettings';
import { requestSheetValidation, type SheetValidationResult } from '../validateSheet';
import { notify } from '@/modules/notifications';

interface Props {
  open: boolean;
  currentSheetId: string | null;
  onClose: () => void;
  onConnected: (sheetId: string) => void;
  onDisconnect: () => void;
}

function errorMessage(result: Extract<SheetValidationResult, { ok: false }>): string {
  switch (result.reason) {
    case 'missing-headers': {
      const cols = result.missing.join(' and ');
      const noun = result.missing.length > 1 ? 'columns' : 'column';
      return `Add the ${cols} ${noun} in row 1 of your sheet, then try again.`;
    }
    case 'unauthenticated':
      return 'Sign in with Google first, then connect your sheet.';
    case 'unreachable':
    default:
      return "Couldn't reach that sheet. Check the link and that you have access to it.";
  }
}

export default function ConnectSheetModal({
  open,
  currentSheetId,
  onClose,
  onConnected,
  onDisconnect,
}: Props) {
  const [draft, setDraft] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Portal to <body>: the top bar's backdrop-filter would otherwise make this fixed
  // overlay position relative to the bar (clipping it) instead of the viewport.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reset transient state whenever the modal opens.
  useEffect(() => {
    if (open) {
      setDraft('');
      setError(null);
      setValidating(false);
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const connect = async () => {
    const id = parseSpreadsheetId(draft);
    if (!id) {
      setError('Enter a valid Google Sheet URL or ID.');
      return;
    }
    setValidating(true);
    setError(null);
    const result = await requestSheetValidation(id);
    setValidating(false);
    if (!result.ok) {
      setError(errorMessage(result));
      return;
    }
    saveVocabSheetId(id);
    notify({ variant: 'success', message: 'Vocabulary sheet connected' });
    onConnected(id);
    onClose();
  };

  const disconnect = () => {
    clearVocabSheetId();
    onDisconnect();
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-gray-900/40"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect your vocabulary sheet"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 text-lg">
            📄
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Connect your vocabulary sheet</h2>
            <p className="text-sm text-gray-500">Saved words sync to a Google Sheet you own.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {currentSheetId && (
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Connected — paste a new sheet below to change it, or disconnect.
          </p>
        )}

        <label className="mt-4 block text-sm font-medium text-gray-700">Google Sheet URL or ID</label>
        <input
          type="text"
          value={draft}
          autoFocus
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && connect()}
          placeholder="https://docs.google.com/spreadsheets/d/…"
          className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'
          }`}
        />

        {error ? (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        ) : (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
            <span aria-hidden>ℹ️</span>
            <span>
              Add <strong>Finnish</strong> and <strong>Translation</strong> headers in row 1. The
              app adds <strong>Last Tested</strong> and <strong>Review Interval</strong> itself.
            </span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          {currentSheetId ? (
            <button
              type="button"
              onClick={disconnect}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={connect}
            disabled={validating}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {validating ? 'Checking…' : 'Connect sheet'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
