import { getSheetsClient } from '@/lib/googleSheetsClient';
import type { sheets_v4 } from 'googleapis';
import type { VocabRepository } from '../ports/VocabRepository';
import type { VocabLookup } from '../vocabStorage';

export const VOCAB_STATUS = {
  NEW: 'New',
  LEARNING: 'Learning',
  KNOWN: 'Known',
} as const;

const REQUIRED_HEADERS = ['Finnish', 'Translation'] as const;
const APP_HEADERS = ['Status', 'Last Tested'] as const;
export type HeaderMap = Record<string, number>;

// Resolves the app-owned column layout for the sheet (by header name, per decision 003),
// provisioning the Status / Last Tested columns if absent. Shared with the vocab-test
// knowledge layer so the sheet schema lives in one place.
export async function getOrProvisionHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
): Promise<{ sheetName: string; headers: HeaderMap }> {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet =
    meta.data.sheets?.find((s) => s.properties?.title === 'Vocabulary') ??
    meta.data.sheets?.[0];
  if (!sheet?.properties?.title) throw new Error('Spreadsheet has no sheets');
  const sheetName = sheet.properties.title;

  const headerRange = `'${sheetName}'!1:1`;
  const headerRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });
  const existing: string[] = headerRes.data.values?.[0] ?? [];

  const missing = REQUIRED_HEADERS.filter((h) => !existing.includes(h));
  if (missing.length > 0) {
    throw new Error(
      `Required columns missing from your spreadsheet: ${missing.join(', ')}. ` +
        'Please add them as headers in row 1 and try again.',
    );
  }

  const toAdd = APP_HEADERS.filter((h) => !existing.includes(h));
  const allHeaders = toAdd.length > 0 ? [...existing, ...toAdd] : existing;

  if (toAdd.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: 'RAW',
      requestBody: { values: [allHeaders] },
    });
  }

  const headerMap: HeaderMap = {};
  allHeaders.forEach((h, i) => {
    headerMap[h] = i;
  });
  return { sheetName, headers: headerMap };
}

export type SheetValidation =
  | { ok: true }
  | { ok: false; reason: 'missing-headers'; missing: string[] }
  | { ok: false; reason: 'unreachable'; message: string };

/**
 * Read-only check that a sheet is usable as a vocabulary store: reachable with the
 * user's token and has the required `Finnish` / `Translation` headers in row 1.
 * Unlike `getOrProvisionHeaders`, this never mutates the sheet (no header provisioning) —
 * provisioning of the app-owned headers stays lazy on first save.
 */
export async function validateVocabSheet(spreadsheetId: string): Promise<SheetValidation> {
  try {
    const sheets = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet =
      meta.data.sheets?.find((s) => s.properties?.title === 'Vocabulary') ??
      meta.data.sheets?.[0];
    const sheetName = sheet?.properties?.title;
    if (!sheetName) return { ok: false, reason: 'unreachable', message: 'Spreadsheet has no sheets' };

    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!1:1`,
    });
    const existing: string[] = headerRes.data.values?.[0] ?? [];
    const missing = REQUIRED_HEADERS.filter((h) => !existing.includes(h));
    if (missing.length > 0) return { ok: false, reason: 'missing-headers', missing };
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'unreachable', message: String(error) };
  }
}

// Words are matched case-insensitively and trimmed so the same word isn't saved twice.
function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function buildRow(headers: HeaderMap, values: Record<string, string>): string[] {
  const ownedIndices = ['Finnish', 'Translation', 'Status', 'Last Tested']
    .map((h) => headers[h] ?? -1)
    .filter((i) => i >= 0);
  const maxCol = Math.max(...ownedIndices);
  const row = new Array<string>(maxCol + 1).fill('');
  for (const [header, value] of Object.entries(values)) {
    const idx = headers[header];
    if (idx !== undefined) row[idx] = value;
  }
  return row;
}

/**
 * Builds a VocabRepository bound to one user-supplied spreadsheet. The sheet ID is
 * provided per request (from the client), not from the environment, so each user can
 * point the app at their own Google Sheet.
 */
export function createGoogleSheetsVocabRepository(spreadsheetId: string): VocabRepository {
  return {
  async record(word, translation) {
    try {
      const sheets = await getSheetsClient();
      const { sheetName, headers } = await getOrProvisionHeaders(sheets, spreadsheetId);

      // De-duplicate: if the word is already saved, do nothing. (Updating an existing
      // word's knowledge/status belongs to the quiz flow, not to saving while reading.)
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A2:Z`,
      });
      const finnishCol = headers['Finnish'];
      const alreadySaved = (existing.data.values ?? []).some(
        (r) => normalizeWord(String(r[finnishCol] ?? '')) === normalizeWord(word),
      );
      if (alreadySaved) return true;

      const row = buildRow(headers, {
        Finnish: word,
        Translation: translation,
        Status: VOCAB_STATUS.NEW,
      });
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${sheetName}'!A:A`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
      });
      return true;
    } catch (error) {
      console.error('[GoogleSheetsVocabRepository] record error:', error);
      return false;
    }
  },

  async getAll() {
    try {
      const sheets = await getSheetsClient();
      const { sheetName, headers } = await getOrProvisionHeaders(sheets, spreadsheetId);
      const dataRange = `'${sheetName}'!A2:Z`;
      const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: dataRange });
      const rows = res.data.values ?? [];
      return rows
        .filter((row) => row[headers['Finnish']])
        .map((row): VocabLookup => ({
          word: String(row[headers['Finnish']] ?? ''),
          translation: String(row[headers['Translation']] ?? ''),
          sourceLang: 'fi',
          targetLang: 'en',
          timestamp: String(row[headers['Last Tested']] ?? ''),
        }));
    } catch (error) {
      console.error('[GoogleSheetsVocabRepository] getAll error:', error);
      return [];
    }
  },

  async clear() {
    // Not implemented — deleting sheet rows is too destructive without an explicit confirmation UI
    return false;
  },
  };
}
