import { getSheetsClient } from '@/lib/googleSheetsClient';
import { getOrProvisionHeaders } from '@/modules/vocab-store/adapters/GoogleSheetsVocabRepository';
import type { KnowledgeRepository } from '../ports/KnowledgeRepository';
import type { KnowledgeItem, ReviewState } from '../types';

// 0-based column index → A1 column letters (0→A, 25→Z, 26→AA).
function columnLetter(index: number): string {
  let n = index;
  let letters = '';
  do {
    letters = String.fromCharCode((n % 26) + 65) + letters;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return letters;
}

function parseInterval(raw: string): number | null {
  const n = Number(raw);
  return raw !== '' && Number.isFinite(n) ? n : null;
}

// Reads vocabulary + scheduling state and writes graded results back to the app-owned
// Last Tested / Review Interval columns by header name (decisions 003/004). Status is a user
// sheet formula — never read or written here. Reuses the vocab-store header logic.
export function createGoogleSheetsKnowledgeRepository(spreadsheetId: string): KnowledgeRepository {
  return {
    async getAll(): Promise<KnowledgeItem[]> {
      const sheets = await getSheetsClient();
      const { sheetName, headers } = await getOrProvisionHeaders(sheets, spreadsheetId);
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A2:Z`,
      });
      const rows = res.data.values ?? [];
      const fi = headers['Finnish'];
      const tr = headers['Translation'];
      const lt = headers['Last Tested'];
      const iv = headers['Review Interval'];
      const ex = headers['Example']; // user-owned, optional — read-only, never written

      return rows
        .map((row, i): KnowledgeItem => {
          const lastRaw = String(row[lt] ?? '').trim();
          const exampleRaw = ex === undefined ? '' : String(row[ex] ?? '').trim();
          return {
            rowNumber: i + 2, // data starts at sheet row 2
            finnish: String(row[fi] ?? '').trim(),
            translation: String(row[tr] ?? '').trim(),
            example: exampleRaw || null,
            lastTested: lastRaw || null,
            intervalSeconds: parseInterval(String(row[iv] ?? '').trim()),
          };
        })
        .filter((item) => item.finnish && item.translation);
    },

    async recordResult(rowNumber: number, state: ReviewState): Promise<boolean> {
      try {
        const sheets = await getSheetsClient();
        const { sheetName, headers } = await getOrProvisionHeaders(sheets, spreadsheetId);
        const lastCol = columnLetter(headers['Last Tested']);
        const intervalCol = columnLetter(headers['Review Interval']);
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: [
              { range: `'${sheetName}'!${lastCol}${rowNumber}`, values: [[state.lastTested]] },
              { range: `'${sheetName}'!${intervalCol}${rowNumber}`, values: [[state.intervalSeconds]] },
            ],
          },
        });
        return true;
      } catch (error) {
        console.error('[GoogleSheetsKnowledgeRepository] recordResult error:', error);
        return false;
      }
    },
  };
}
