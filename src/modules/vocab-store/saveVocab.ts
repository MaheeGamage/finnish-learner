import { getVocabSheetId } from './sheetSettings';
import { isClientVocabSavingEnabled } from './vocabSavingFlag';
import { notify } from '@/modules/notifications';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';

// One coalescing key for all save failures, so a burst (one per word) shows a single
// non-blocking notice rather than spamming the reader.
const SAVE_FAIL_KEY = 'vocab-save-failed';

function notifySaveFailed(word: string) {
  notify({
    variant: 'error',
    message: `Couldn't save “${word}” to your sheet`,
    dedupeKey: SAVE_FAIL_KEY,
  });
}

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
    const res = await fetch('/api/vocab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [SHEET_ID_HEADER]: sheetId },
      body: JSON.stringify({ word, translation, sourceLang, targetLang }),
    });
    // A bad/disconnected sheet (502), expired token (401), etc. — surface it instead
    // of failing silently. Success stays silent so reading isn't interrupted.
    if (!res.ok) notifySaveFailed(word);
  } catch {
    // Network error — still fire-and-forget for the reading flow, but let the user know.
    notifySaveFailed(word);
  }
}
