'use client';

import { useState, useMemo, useEffect } from 'react';
import type { TranslationEvent } from './types';
import { aggregateTranslations } from './sessionExport';

interface SessionSummaryProps {
  translations: TranslationEvent[];
  sessionStart: number | null;
  sourceLang: string;
  targetLang: string;
  contentSnippet: string;
}

export default function SessionSummary({
  translations,
  sessionStart,
  sourceLang,
  targetLang,
  contentSnippet,
}: SessionSummaryProps) {
  const [isExporting, setIsExporting] = useState(false);
  const aggregated = useMemo(() => aggregateTranslations(translations), [translations]);

  // Silently sync the current session to the server whenever the data changes so
  // that GET /api/session always serves an up-to-date overview — even before the
  // user explicitly clicks "Export". Debounced to avoid excessive API calls when
  // translations are accumulating rapidly during an active reading session.
  useEffect(() => {
    if (translations.length === 0) return;
    const timer = setTimeout(() => {
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translations, sessionStart, sourceLang, targetLang, contentSnippet }),
      }).catch(() => {
        // Silent sync — ignore errors; the export button will surface them if needed.
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [translations, sessionStart, sourceLang, targetLang, contentSnippet]);

  const hoverCount = translations.filter((e) => e.type === 'hover').length;
  const selectionCount = translations.filter((e) => e.type === 'selection').length;

  const sessionDurationLabel = (() => {
    if (!sessionStart) return '—';
    const ms = Date.now() - sessionStart;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  })();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translations, sessionStart, sourceLang, targetLang, contentSnippet }),
      });

      if (!response.ok) {
        console.error('Failed to export session:', await response.text());
        return;
      }

      const blob = await response.blob();
      const filename =
        response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] ??
        'session.json';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (translations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📖</div>
        <p className="text-gray-500 text-base">No translations yet.</p>
        <p className="text-gray-400 text-sm mt-1">
          Switch to Reading and hover over or select words to translate them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Translations" value={String(translations.length)} />
        <StatCard label="Unique Words" value={String(aggregated.length)} />
        <StatCard label="Session Duration" value={sessionDurationLabel} />
        <StatCard
          label="Hover / Selection"
          value={`${hoverCount} / ${selectionCount}`}
        />
      </div>

      {/* Most translated words */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Most Translated Words
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-medium">Word</th>
                <th className="px-3 py-2 text-left font-medium">Translation</th>
                <th className="px-3 py-2 text-center font-medium">Times</th>
                <th className="px-3 py-2 text-center font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.slice(0, 10).map((item, idx) => (
                <tr
                  key={item.word}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-3 py-2 font-medium text-gray-800">{item.word}</td>
                  <td className="px-3 py-2 text-indigo-600">
                    {typeof item.translation === 'string' 
                      ? item.translation 
                      : (item.translation as any)?.fallbackTranslation || 'Translation error'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block min-w-[1.5rem] text-center px-1.5 py-0.5 rounded-full text-xs font-semibold
                      ${item.count > 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.count}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full
                      ${item.type === 'hover' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                      {item.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {aggregated.length > 10 && (
          <p className="text-xs text-gray-400 mt-1 text-right">
            +{aggregated.length - 10} more words translated
          </p>
        )}
      </div>

      {/* Export button + View JSON link */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <a
          href="/api/session"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 border border-indigo-300 text-indigo-600
            text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <span>🔗</span>
          View JSON
        </a>
        <button
          onClick={handleExport}
          disabled={isExporting}
          aria-busy={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white 
            text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors 
            shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{isExporting ? '⏳' : '⬇️'}</span>
          {isExporting ? 'Exporting…' : 'Export Session JSON'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
      <div className="text-lg font-bold text-indigo-700">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
