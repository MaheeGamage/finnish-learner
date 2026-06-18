import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuizService } from '@/modules/vocab-test/service';
import { parseTuningJson, DEFAULT_TUNING } from '@/modules/vocab-test/settings';
import type { QuizSessionResponse } from '@/modules/vocab-test/types';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';
const TUNING_HEADER = 'x-srs-tuning';

// GET /api/quiz/session — builds the quiz queue (SessionSelector) from the user's sheet.
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const sheetId = request.headers.get(SHEET_ID_HEADER);
  if (!sheetId) return NextResponse.json({ error: 'No vocabulary sheet configured' }, { status: 400 });

  // Client-supplied tuning (task-011) — validated; falls back to defaults on anything invalid.
  const tuning = parseTuningJson(request.headers.get(TUNING_HEADER)) ?? DEFAULT_TUNING;

  try {
    const { repo, mechanism, selector } = getQuizService(sheetId, tuning);
    const items = await repo.getAll();
    const cards = selector.select(items, {
      size: tuning.sessionSize,
      now: new Date(),
      dueAt: mechanism.dueAt,
    });
    return NextResponse.json({ cards } satisfies QuizSessionResponse);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
