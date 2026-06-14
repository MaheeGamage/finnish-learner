import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getQuizService } from '@/modules/vocab-test/service';
import type { Grade, KnowledgeItem, QuizResultRequest, QuizResultResponse } from '@/modules/vocab-test/types';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';
const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

// POST /api/quiz/result — applies the grade (TestMechanism) and writes the new scheduling
// state (Last Tested / Review Interval) back to the row. Status is a user formula (decision 004).
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const sheetId = request.headers.get(SHEET_ID_HEADER);
  if (!sheetId) return NextResponse.json({ error: 'No vocabulary sheet configured' }, { status: 400 });

  const body = (await request.json().catch(() => null)) as Partial<QuizResultRequest> | null;
  if (
    !body ||
    typeof body.rowNumber !== 'number' ||
    !Number.isInteger(body.rowNumber) ||
    body.rowNumber < 2 ||
    typeof body.grade !== 'string' ||
    !GRADES.includes(body.grade as Grade)
  ) {
    return NextResponse.json(
      { error: 'rowNumber (integer >= 2) and a valid grade are required' },
      { status: 400 },
    );
  }

  const item: KnowledgeItem = {
    rowNumber: body.rowNumber,
    finnish: '',
    translation: '',
    lastTested: body.lastTested ?? null,
    intervalSeconds: body.intervalSeconds ?? null,
  };

  const { repo, mechanism } = getQuizService(sheetId);
  const state = mechanism.grade(item, body.grade as Grade, new Date());
  const ok = await repo.recordResult(body.rowNumber, state);
  if (!ok) return NextResponse.json({ ok: false } satisfies QuizResultResponse, { status: 502 });
  return NextResponse.json({ ok: true, state } satisfies QuizResultResponse);
}
