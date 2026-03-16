'use client';

import { useMemo } from 'react';
import type { TranslationEvent, AggregatedTranslation, SessionSummaryExport } from '@/types/session';

interface SessionSummaryProps {
  translations: TranslationEvent[];
  sessionStart: number | null;
  sourceLang: string;
  targetLang: string;
  contentSnippet: string;
}

function aggregateTranslations(events: TranslationEvent[]): AggregatedTranslation[] {
  const map = new Map<string, AggregatedTranslation>();

  for (const event of events) {
    // Group by lowercased word so "Helsinki" and "helsinki" are counted together.
    // The display word is taken from the first occurrence's original casing
    // (i.e. the first time the word was translated in this session).
    const key = event.word.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.lastTranslatedAt = event.timestamp;
      // Prefer selection as the stored type when it occurs, because a selection
      // represents a more deliberate translation request than a hover.
      if (event.type === 'selection') {
        existing.type = 'selection';
      }
    } else {
      map.set(key, {
        word: event.word,
        translation: event.translation,
        type: event.type,
        count: 1,
        firstTranslatedAt: event.timestamp,
        lastTranslatedAt: event.timestamp,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function buildExport(
  translations: TranslationEvent[],
  sessionStart: number | null,
  sourceLang: string,
  targetLang: string,
  contentSnippet: string,
): SessionSummaryExport {
  const sessionEnd = Date.now();
  const start = sessionStart ?? sessionEnd;
  const durationMs = sessionEnd - start;
  const durationMinutes = Math.round((durationMs / 60000) * 10) / 10;

  const aggregated = aggregateTranslations(translations);
  const hoverCount = translations.filter((e) => e.type === 'hover').length;
  const selectionCount = translations.filter((e) => e.type === 'selection').length;
  const avgTranslationsPerMinute =
    durationMinutes > 0 ? Math.round((translations.length / durationMinutes) * 10) / 10 : 0;

  const sessionId = `session-${start}`;

  return {
    sessionId,
    sessionStart: new Date(start).toISOString(),
    sessionEnd: new Date(sessionEnd).toISOString(),
    durationMinutes,
    sourceLang,
    targetLang,
    contentSnippet,
    stats: {
      totalTranslationEvents: translations.length,
      uniqueWordsTranslated: aggregated.length,
      hoverTranslations: hoverCount,
      selectionTranslations: selectionCount,
      avgTranslationsPerMinute,
    },
    mostTranslatedWords: aggregated.slice(0, 10).map((a) => ({
      word: a.word,
      translation: a.translation,
      count: a.count,
      type: a.type,
    })),
    allTranslations: aggregated.map((a) => ({
      word: a.word,
      translation: a.translation,
      type: a.type,
      count: a.count,
      firstSeenAt: new Date(a.firstTranslatedAt).toISOString(),
      lastSeenAt: new Date(a.lastTranslatedAt).toISOString(),
    })),
  };
}

export default function SessionSummary({
  translations,
  sessionStart,
  sourceLang,
  targetLang,
  contentSnippet,
}: SessionSummaryProps) {
  const aggregated = useMemo(() => aggregateTranslations(translations), [translations]);

  const hoverCount = translations.filter((e) => e.type === 'hover').length;
  const selectionCount = translations.filter((e) => e.type === 'selection').length;

  const sessionDurationLabel = (() => {
    if (!sessionStart) return '—';
    const ms = Date.now() - sessionStart;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  })();

  const handleExport = () => {
    const data = buildExport(translations, sessionStart, sourceLang, targetLang, contentSnippet);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
                  <td className="px-3 py-2 text-indigo-600">{item.translation}</td>
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

      {/* Export button */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white 
            text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors 
            shadow-sm hover:shadow-md"
        >
          <span>⬇️</span>
          Export Session JSON
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
