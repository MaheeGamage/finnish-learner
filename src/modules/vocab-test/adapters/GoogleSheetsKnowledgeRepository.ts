import { getSheetsClient } from '@/lib/googleSheetsClient';
import { getOrProvisionHeaders } from '@/modules/vocab-store/adapters/GoogleSheetsVocabRepository';
import type { KnowledgeRepository } from '../ports/KnowledgeRepository';
import type { KnowledgeItem, ReviewState, Status } from '../types';

const VALID_STATUS: readonly string[] = ['New', 'Learning', 'Known'];

function asStatus(value: string): Status | null {
  return VALID_STATUS.includes(value) ? (value as Status) : null;
}

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

// Reads vocabulary + knowledge from the user's sheet and writes graded results back to the
// app-owned Status / Last Tested columns by header name (decision 003). Reuses the vocab-store
// header logic so the schema lives in one place.
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
      const st = headers['Status'];
      const lt = headers['Last Tested'];

      return rows
        .map((row, i): KnowledgeItem => {
          const statusRaw = String(row[st] ?? '').trim();
          const lastRaw = String(row[lt] ?? '').trim();
          return {
            rowNumber: i + 2, // data starts at sheet row 2
            finnish: String(row[fi] ?? '').trim(),
            translation: String(row[tr] ?? '').trim(),
            status: asStatus(statusRaw),
            lastTested: lastRaw || null,
          };
        })
        .filter((item) => item.finnish && item.translation);
    },

    async recordResult(rowNumber: number, state: ReviewState): Promise<boolean> {
      try {
        const sheets = await getSheetsClient();
        const { sheetName, headers } = await getOrProvisionHeaders(sheets, spreadsheetId);
        const statusCol = columnLetter(headers['Status']);
        const lastCol = columnLetter(headers['Last Tested']);
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: [
              { range: `'${sheetName}'!${statusCol}${rowNumber}`, values: [[state.status]] },
              { range: `'${sheetName}'!${lastCol}${rowNumber}`, values: [[state.lastTested]] },
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
