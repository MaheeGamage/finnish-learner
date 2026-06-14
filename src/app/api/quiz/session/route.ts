import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuizService, DEFAULT_SESSION_SIZE } from '@/modules/vocab-test/service';
import type { QuizSessionResponse } from '@/modules/vocab-test/types';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';

// GET /api/quiz/session — builds the quiz queue (SessionSelector) from the user's sheet.
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const sheetId = request.headers.get(SHEET_ID_HEADER);
  if (!sheetId) return NextResponse.json({ error: 'No vocabulary sheet configured' }, { status: 400 });

  try {
    const { repo, mechanism, selector } = getQuizService(sheetId);
    const items = await repo.getAll();
    const cards = selector.select(items, {
      size: DEFAULT_SESSION_SIZE,
      now: new Date(),
      dueAt: mechanism.dueAt,
    });
    return NextResponse.json({ cards } satisfies QuizSessionResponse);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
