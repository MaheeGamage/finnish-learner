// Per-user vocabulary sheet: the user points the app at their own Google Sheet.
// The chosen sheet ID lives in localStorage (consistent with the app's other state)
// and is sent to the API on each vocab request.
const VOCAB_SHEET_ID_KEY = 'finnish_vocab_spreadsheet_id';

/**
 * Accepts either a full Google Sheets URL or a bare spreadsheet ID and returns the ID.
 * Returns null if nothing usable can be extracted.
 */
export const parseSpreadsheetId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  // Treat a bare token (no slashes/spaces) as an ID already.
  if (/^[a-zA-Z0-9-_]+$/.test(trimmed)) return trimmed;
  return null;
};

export const getVocabSheetId = (): string | null => {
  try {
    return localStorage.getItem(VOCAB_SHEET_ID_KEY);
  } catch (error) {
    console.error('Error reading vocab sheet id:', error);
    return null;
  }
};

/**
 * Stores the user's sheet. Accepts a URL or ID; returns the saved ID, or null if the
 * input could not be parsed (in which case nothing is stored).
 */
export const saveVocabSheetId = (input: string): string | null => {
  const id = parseSpreadsheetId(input);
  if (!id) return null;
  try {
    localStorage.setItem(VOCAB_SHEET_ID_KEY, id);
    return id;
  } catch (error) {
    console.error('Error saving vocab sheet id:', error);
    return null;
  }
};

export const clearVocabSheetId = (): void => {
  try {
    localStorage.removeItem(VOCAB_SHEET_ID_KEY);
  } catch (error) {
    console.error('Error clearing vocab sheet id:', error);
  }
};
