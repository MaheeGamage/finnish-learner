import type { TranslationEvent, AggregatedTranslation, SessionSummaryExport } from './types';

// Number of characters to include in the content snippet for session exports
export const SESSION_CONTENT_SNIPPET_LENGTH = 200;

export function aggregateTranslations(events: TranslationEvent[]): AggregatedTranslation[] {
  const map = new Map<string, AggregatedTranslation>();

  for (const event of events) {
    // Group by lowercased word so "Helsinki" and "helsinki" are counted together.
    // The display word preserves the casing of the first occurrence that created
    // the map entry (i.e. the first time this word was seen in the session).
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

export function buildExport(
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
