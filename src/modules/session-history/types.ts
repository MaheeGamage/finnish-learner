export interface TranslationEvent {
  word: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  type: 'hover' | 'selection';
  timestamp: number;
}

export interface AggregatedTranslation {
  word: string;
  translation: string;
  type: 'hover' | 'selection';
  count: number;
  firstTranslatedAt: number;
  lastTranslatedAt: number;
}

export interface SessionSummaryExport {
  sessionId: string;
  sessionStart: string;
  sessionEnd: string;
  durationMinutes: number;
  sourceLang: string;
  targetLang: string;
  contentSnippet: string;
  stats: {
    totalTranslationEvents: number;
    uniqueWordsTranslated: number;
    hoverTranslations: number;
    selectionTranslations: number;
    avgTranslationsPerMinute: number;
  };
  mostTranslatedWords: {
    word: string;
    translation: string;
    count: number;
    type: 'hover' | 'selection';
  }[];
  allTranslations: {
    word: string;
    translation: string;
    type: 'hover' | 'selection';
    count: number;
    firstSeenAt: string;
    lastSeenAt: string;
  }[];
}
