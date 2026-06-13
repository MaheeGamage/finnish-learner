import { getVocabSheetId } from './sheetSettings';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';
const FALSE_ENV_VALUES = new Set(['0', 'false', 'no', 'off']);

const isVocabSavingEnabled = (): boolean => {
  const envValue = process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED;
  if (!envValue) return true;
  return !FALSE_ENV_VALUES.has(envValue.trim().toLowerCase());
};

export async function saveVocab(
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string,
): Promise<void> {
  if (!isVocabSavingEnabled()) return;

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
