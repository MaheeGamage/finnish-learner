/**
 * vocab-store — public API
 * Persists the words the user is learning.
 * saveVocab: client-side entry point → POSTs to /api/vocab → GoogleSheetsVocabRepository
 * recordLookup / getLookups / clearLookups: legacy localStorage helpers (kept for compatibility)
 */

export { saveVocab } from './saveVocab';
export {
  getVocabSheetId,
  saveVocabSheetId,
  clearVocabSheetId,
  parseSpreadsheetId,
} from './sheetSettings';
export { default as VocabSheetField } from './components/VocabSheetField';
export { recordLookup, getLookups, clearLookups } from './vocabStorage';
export type { VocabLookup } from './vocabStorage';
export type { VocabRepository } from './ports/VocabRepository';
