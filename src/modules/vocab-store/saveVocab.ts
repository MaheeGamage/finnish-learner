import { getVocabSheetId } from './sheetSettings';
import { isClientVocabSavingEnabled } from './vocabSavingFlag';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';

export async function saveVocab(
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string,
): Promise<void> {
  if (!isClientVocabSavingEnabled()) return;

  const sheetId = getVocabSheetId();
  // No sheet configured yet — nothing to save to. Reading is unaffected.
  if (!sheetId) return;
  try {
    await fetch('/api/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [SHEET_ID_HEADER]: sheetId },
      body: JSON.stringify({ word, translation, sourceLang, targetLang }),
    });
  } catch {
    // Fire-and-forget — don't interrupt the reading flow on network errors
  }
}
