'use client';

import { useState, useEffect } from 'react';
import { getVocabSheetId, saveVocabSheetId, clearVocabSheetId } from '../sheetSettings';

// Lets the user point the app at their own Google Sheet for vocabulary.
// Collapsed to a small button once a sheet is set; expands to an input to change it.
export default function VocabSheetField() {
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = getVocabSheetId();
    setSheetId(stored);
    setEditing(!stored);
  }, []);

  const submit = () => {
    const saved = saveVocabSheetId(draft);
    if (!saved) {
      setError(true);
      return;
    }
    setSheetId(saved);
    setDraft('');
    setError(false);
    setEditing(false);
  };

  if (!editing && sheetId) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={`Vocabulary sheet: ${sheetId}`}
        className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
      >
        📄 Vocab sheet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={draft}
        autoFocus
        onChange={(e) => {
          setDraft(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Paste your Google Sheet URL or ID"
        className={`px-2 py-1.5 text-sm rounded-lg border w-64 ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      <button
        type="button"
        onClick={submit}
        className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
      >
        Save
      </button>
      {sheetId && (
        <button
          type="button"
          onClick={() => {
            clearVocabSheetId();
            setSheetId(null);
            setDraft('');
          }}
          title="Remove sheet"
          className="px-2 py-1.5 text-sm rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
