import { getVocabSheetId } from '@/modules/vocab-store';
import { loadTuning } from './settings';
import type {
  Grade,
  QuizCard,
  QuizResultRequest,
  QuizResultResponse,
  QuizSessionResponse,
} from './types';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';
const TUNING_HEADER = 'x-srs-tuning';

// The user's saved SRS settings (task-011), sent to the API so grading/selection use them.
const tuningHeader = (): string => JSON.stringify(loadTuning());

export type QuizSessionResult =
  | { ok: true; cards: QuizCard[] }
  | { ok: false; reason: 'no-sheet' | 'unauthenticated' | 'error' };

// Client → GET /api/quiz/session. Builds the session queue from the user's connected sheet.
export async function fetchQuizSession(): Promise<QuizSessionResult> {
  const sheetId = getVocabSheetId();
  if (!sheetId) return { ok: false, reason: 'no-sheet' };
  let res: Response;
  try {
    res = await fetch('/api/quiz/session', {
      headers: { [SHEET_ID_HEADER]: sheetId, [TUNING_HEADER]: tuningHeader() },
    });
  } catch {
    return { ok: false, reason: 'error' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthenticated' };
  if (!res.ok) return { ok: false, reason: 'error' };
  const data = (await res.json()) as QuizSessionResponse;
  return { ok: true, cards: data.cards };
}

// Client → POST /api/quiz/result. Records one graded card.
export async function submitQuizResult(
  rowNumber: number,
  lastTested: string | null,
  intervalSeconds: number | null,
  grade: Grade,
): Promise<QuizResultResponse> {
  const sheetId = getVocabSheetId();
  if (!sheetId) return { ok: false };
  const payload: QuizResultRequest = { rowNumber, lastTested, intervalSeconds, grade };
  try {
    const res = await fetch('/api/quiz/result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SHEET_ID_HEADER]: sheetId,
        [TUNING_HEADER]: tuningHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false };
    return (await res.json()) as QuizResultResponse;
  } catch {
    return { ok: false };
  }
}
