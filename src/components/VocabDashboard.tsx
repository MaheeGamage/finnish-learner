'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VocabEntry,
  VocabStore,
  getVocabStore,
  clearVocabStore,
  exportVocabAsJSON,
  exportVocabAsCSV,
  importVocabFromJSON,
} from '@/utils/vocabStorage';
import { getGistSettings, saveGistSettings, pushToGist, pullFromGist } from '@/utils/gistSync';
import VocabPractice from '@/components/VocabPractice';

type SortKey = 'lookupCount' | 'word' | 'lastSeen';

const STRUGGLE_HIGH = 5;
const STRUGGLE_MED = 3;

function getRowStyle(entry: VocabEntry): string {
  if (entry.lookupCount >= STRUGGLE_HIGH) return 'bg-red-50 border-l-4 border-l-red-400';
  if (entry.lookupCount >= STRUGGLE_MED) return 'bg-yellow-50 border-l-4 border-l-yellow-400';
  return 'bg-green-50 border-l-4 border-l-green-400';
}

function getBadge(entry: VocabEntry): { label: string; cn: string } {
  if (entry.lookupCount >= STRUGGLE_HIGH) return { label: 'Struggling', cn: 'bg-red-100 text-red-700' };
  if (entry.lookupCount >= STRUGGLE_MED) return { label: 'Shaky', cn: 'bg-yellow-100 text-yellow-700' };
  return { label: 'New', cn: 'bg-green-100 text-green-700' };
}

function sortEntries(entries: VocabEntry[], key: SortKey): VocabEntry[] {
  return [...entries].sort((a, b) => {
    if (key === 'lookupCount') return b.lookupCount - a.lookupCount;
    if (key === 'lastSeen') return b.lastSeen - a.lastSeen;
    if (key === 'word') return a.word.localeCompare(b.word);
    return 0;
  });
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VocabDashboard() {
  const [store, setStore] = useState<VocabStore>({});
  const [sortKey, setSortKey] = useState<SortKey>('lookupCount');
  const [search, setSearch] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showGistSettings, setShowGistSettings] = useState(false);
  const [gistPat, setGistPat] = useState('');
  const [gistId, setGistId] = useState('');
  const [gistStatus, setGistStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [gistLoading, setGistLoading] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [autoSyncStatus, setAutoSyncStatus] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStore = useCallback(() => setStore(getVocabStore()), []);

  // Refresh store when returning from practice
  const handleExitPractice = useCallback(() => {
    setShowPractice(false);
    loadStore();
  }, [loadStore]);

  // Auto-push after a practice session ends; called by VocabPractice when last card is answered
  const handleSessionEnd = useCallback(async (): Promise<{ type: 'ok' | 'err'; msg: string }> => {
    const settings = getGistSettings();
    if (!settings.pat || !settings.gistId) return { type: 'ok', msg: '' }; // sync not configured
    try {
      const json = exportVocabAsJSON();
      await pushToGist(json, settings.pat, settings.gistId);
      return { type: 'ok', msg: 'Synced to Gist' };
    } catch (err) {
      return { type: 'err', msg: `Sync failed: ${(err as Error).message}` };
    }
  }, []);

  useEffect(() => {
    loadStore();
    const settings = getGistSettings();
    setGistPat(settings.pat);
    setGistId(settings.gistId);

    // Auto-pull on mount if Gist is configured
    if (settings.pat && settings.gistId) {
      pullFromGist(settings.pat, settings.gistId)
        .then((json) => {
          importVocabFromJSON(json);
          loadStore();
          setAutoSyncStatus({ type: 'ok', msg: 'Vocab synced from Gist' });
          setTimeout(() => setAutoSyncStatus(null), 4000);
        })
        .catch(() => {
          // Silent fail — don't alert on every load for a background operation
        });
    }
  }, [loadStore]);

  const entries = Object.values(store);
  const filtered = entries.filter(
    (e) =>
      e.word.includes(search.toLowerCase()) ||
      e.translation.toLowerCase().includes(search.toLowerCase()),
  );
  const sorted = sortEntries(filtered, sortKey);

  const stats = {
    total: entries.length,
    struggling: entries.filter((e) => e.lookupCount >= STRUGGLE_HIGH).length,
    shaky: entries.filter((e) => e.lookupCount >= STRUGGLE_MED && e.lookupCount < STRUGGLE_HIGH).length,
    newWords: entries.filter((e) => e.lookupCount < STRUGGLE_MED).length,
  };

  const handleExportJSON = () => downloadFile(exportVocabAsJSON(), 'vocab.json', 'application/json');
  const handleExportCSV = () => downloadFile(exportVocabAsCSV(), 'vocab.csv', 'text/csv');

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string;
        const { imported, merged } = importVocabFromJSON(json);
        loadStore();
        setImportStatus(`Imported ${imported} new, merged ${merged} existing.`);
      } catch {
        setImportStatus('Import failed: invalid JSON.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClear = () => {
    clearVocabStore();
    loadStore();
    setShowConfirmClear(false);
  };

  const handleSaveGistSettings = () => {
    saveGistSettings(gistPat, gistId);
    setGistStatus({ type: 'ok', msg: 'Settings saved.' });
  };

  const handlePush = async () => {
    setGistLoading(true);
    setGistStatus(null);
    try {
      const json = exportVocabAsJSON();
      const newId = await pushToGist(json, gistPat, gistId);
      if (newId !== gistId) {
        setGistId(newId);
        saveGistSettings(gistPat, newId);
      }
      setGistStatus({ type: 'ok', msg: 'Pushed successfully.' });
    } catch (err) {
      setGistStatus({ type: 'err', msg: `Push failed: ${(err as Error).message}` });
    } finally {
      setGistLoading(false);
    }
  };

  const handlePull = async () => {
    setGistLoading(true);
    setGistStatus(null);
    try {
      const json = await pullFromGist(gistPat, gistId);
      const { imported, merged } = importVocabFromJSON(json);
      loadStore();
      setGistStatus({ type: 'ok', msg: `Pulled: ${imported} new, ${merged} merged.` });
    } catch (err) {
      setGistStatus({ type: 'err', msg: `Pull failed: ${(err as Error).message}` });
    } finally {
      setGistLoading(false);
    }
  };

  if (showPractice) {
    return <VocabPractice onExit={handleExitPractice} onSessionEnd={handleSessionEnd} />;
  }

  return (
    <div className="space-y-4">
      {/* Auto-sync status banner */}
      {autoSyncStatus && (
        <div className={`text-xs px-3 py-2 rounded-lg ${
          autoSyncStatus.type === 'ok'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {autoSyncStatus.msg}
        </div>
      )}
      {/* Stats */}
      {/* Stats + Practice */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">Total Words</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-red-700">{stats.struggling}</div>
            <div className="text-xs text-red-500 mt-1">Struggling (5+)</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-yellow-700">{stats.shaky}</div>
            <div className="text-xs text-yellow-500 mt-1">Shaky (3–4)</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-green-700">{stats.newWords}</div>
            <div className="text-xs text-green-500 mt-1">New (1–2)</div>
          </div>
        </div>
        <button
          onClick={() => setShowPractice(true)}
          disabled={entries.length === 0}
          className="sm:w-32 px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl
            hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-40
            disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span>Practice</span>
          <span className="text-lg">→</span>
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search words or translations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200
            bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200
            bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="lookupCount">Sort: Most Looked Up</option>
          <option value="lastSeen">Sort: Recently Seen</option>
          <option value="word">Sort: Alphabetical</option>
        </select>
      </div>

      {/* Word List */}
      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white text-sm">
            {entries.length === 0
              ? 'No words yet. Start reading and translating to build your vocabulary.'
              : 'No words match your search.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
            {sorted.map((entry) => {
              const badge = getBadge(entry);
              return (
                <div
                  key={entry.word}
                  className={`flex items-center gap-3 px-4 py-3 ${getRowStyle(entry)}`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-800 text-sm">{entry.word}</span>
                    <span className="text-gray-400 mx-2 text-xs">→</span>
                    <span className="text-gray-600 text-sm">{entry.translation}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">{entry.lookupCount}×</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cn}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {sorted.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-right">
            {sorted.length} of {entries.length} words
          </div>
        )}
      </div>

      {/* Export / Import / Clear */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 mr-1">Export:</span>
        <button
          onClick={handleExportJSON}
          disabled={entries.length === 0}
          className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg
            hover:bg-indigo-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          JSON
        </button>
        <button
          onClick={handleExportCSV}
          disabled={entries.length === 0}
          className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg
            hover:bg-indigo-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          CSV
        </button>
        <span className="text-sm text-gray-500 ml-2 mr-1">Import:</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg
            hover:bg-gray-200 transition-colors"
        >
          JSON
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        {importStatus && (
          <span className="text-xs text-green-600 ml-2">{importStatus}</span>
        )}
        <div className="ml-auto">
          {!showConfirmClear ? (
            <button
              onClick={() => setShowConfirmClear(true)}
              disabled={entries.length === 0}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg
                hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Clear All
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Delete all vocab?</span>
              <button
                onClick={handleClear}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gist Sync */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowGistSettings(!showGistSettings)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium
            text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>GitHub Gist Sync</span>
          <span className="text-gray-400">{showGistSettings ? '▲' : '▼'}</span>
        </button>
        {showGistSettings && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 pt-2">
              Use a PAT with <code>gist</code> scope only. It is stored in localStorage — do not
              use on shared machines.
            </p>
            <div className="space-y-1">
              <label className="block text-xs text-gray-600">Personal Access Token (PAT)</label>
              <input
                type="password"
                value={gistPat}
                onChange={(e) => setGistPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200
                  bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-gray-600">
                Gist ID <span className="text-gray-400">(auto-filled after first push)</span>
              </label>
              <input
                type="text"
                value={gistId}
                onChange={(e) => setGistId(e.target.value)}
                placeholder="e.g. abc123def456..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200
                  bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleSaveGistSettings}
                disabled={!gistPat}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg
                  hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                Save Settings
              </button>
              <button
                onClick={handlePush}
                disabled={!gistPat || gistLoading || entries.length === 0}
                className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg
                  hover:bg-indigo-200 transition-colors disabled:opacity-40"
              >
                {gistLoading ? 'Working…' : gistId ? 'Push to Gist' : 'Create Gist'}
              </button>
              <button
                onClick={handlePull}
                disabled={!gistPat || !gistId || gistLoading}
                className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg
                  hover:bg-indigo-200 transition-colors disabled:opacity-40"
              >
                {gistLoading ? 'Working…' : 'Pull from Gist'}
              </button>
            </div>
            {gistStatus && (
              <p className={`text-xs ${gistStatus.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                {gistStatus.msg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
