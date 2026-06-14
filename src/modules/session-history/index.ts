/**
 * session-history — public API
 * Tracks a reading session: the words looked up and the session lifecycle.
 */

export { default as SessionSummary } from './SessionSummary';
export { aggregateTranslations, buildExport, SESSION_CONTENT_SNIPPET_LENGTH } from './sessionExport';
export {
    saveSessionTranslations,
    getSessionTranslations,
    clearSessionTranslations,
    saveSessionStart,
    getSessionStart,
    clearSessionStart,
} from './storage';
export type { TranslationEvent, AggregatedTranslation, SessionSummaryExport } from './types';
