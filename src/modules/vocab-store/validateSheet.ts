// Client → GET /api/sheets/validate. Read-only check that a sheet is reachable and has
// the required Finnish/Translation headers, before we store it as the user's vocab sheet.

export type SheetValidationResult =
  | { ok: true }
  | { ok: false; reason: 'missing-headers'; missing: string[] }
  | { ok: false; reason: 'unreachable'; message?: string }
  | { ok: false; reason: 'unauthenticated' };

const SHEET_ID_HEADER = 'x-vocab-sheet-id';

export async function requestSheetValidation(sheetId: string): Promise<SheetValidationResult> {
  let res: Response;
  try {
    res = await fetch('/api/sheets/validate', { headers: { [SHEET_ID_HEADER]: sheetId } });
  } catch {
    return { ok: false, reason: 'unreachable', message: 'Network error' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthenticated' };
  try {
    return (await res.json()) as SheetValidationResult;
  } catch {
    return { ok: false, reason: 'unreachable' };
  }
}
