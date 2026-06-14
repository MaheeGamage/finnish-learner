import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGoogleSheetsVocabRepository } from '@/modules/vocab-store/adapters/GoogleSheetsVocabRepository';
import { isServerVocabSavingEnabled } from '@/modules/vocab-store/vocabSavingFlag';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const sheetId = request.headers.get(SHEET_ID_HEADER);
  if (!sheetId) return NextResponse.json({ error: 'No vocabulary sheet configured' }, { status: 400 });

  const items = await createGoogleSheetsVocabRepository(sheetId).getAll();
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  if (!isServerVocabSavingEnabled()) {
    return NextResponse.json({ ok: true, skipped: 'disabled' });
  }

  const sheetId = request.headers.get(SHEET_ID_HEADER);
  if (!sheetId) return NextResponse.json({ error: 'No vocabulary sheet configured' }, { status: 400 });

  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== 'object' ||
    !('word' in body) ||
    !('translation' in body) ||
    typeof (body as Record<string, unknown>).word !== 'string' ||
    typeof (body as Record<string, unknown>).translation !== 'string'
  ) {
    return NextResponse.json({ error: 'word and translation are required strings' }, { status: 400 });
  }

  const { word, translation, sourceLang, targetLang } = body as Record<string, string>;
  const ok = await createGoogleSheetsVocabRepository(sheetId).record(
    word,
    translation,
    sourceLang ?? 'fi',
    targetLang ?? 'en',
  );
  // A failed write (Sheets API rejected it) must not look like success.
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Failed to save to sheet' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
