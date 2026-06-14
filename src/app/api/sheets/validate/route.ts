import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateVocabSheet } from '@/modules/vocab-store/adapters/GoogleSheetsVocabRepository';

const SHEET_ID_HEADER = 'x-vocab-sheet-id';

// GET /api/sheets/validate — read-only check that the sheet (from the x-vocab-sheet-id
// header) is reachable and has the required Finnish/Translation headers. Used by the
// connect UI before storing the sheet. Does NOT mutate the sheet.
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const sheetId = request.headers.get(SHEET_ID_HEADER);
  if (!sheetId) return NextResponse.json({ error: 'No vocabulary sheet configured' }, { status: 400 });

  const result = await validateVocabSheet(sheetId);
  if (result.ok) return NextResponse.json(result);
  // 422: the sheet is reachable-or-not but not usable as configured.
  return NextResponse.json(result, { status: 422 });
}
