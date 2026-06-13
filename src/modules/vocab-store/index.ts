/**
 * vocab-store — public API
 * Persists the words the user is learning (currently localStorage).
 */

export { recordLookup, getLookups, clearLookups } from './vocabStorage';
export type { VocabLookup } from './vocabStorage';
