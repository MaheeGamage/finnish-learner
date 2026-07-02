// Shared types for the knowledge-testing (quiz) feature.

// User-facing learning stage. Derived in code (and by the sheet's Status formula) from the
// interval — never stored/written by the app (decision 004). STAGE is the single source of
// truth for the three values; the Status type is derived from it so both stay in sync. Every
// reference to a stage (selector throttles, Leitner boxes, the sheet formula) points here.
export const STAGE = {
  New: 'New',
  Learning: 'Learning',
  Known: 'Known',
} as const;

export type Status = (typeof STAGE)[keyof typeof STAGE];

// Self-graded reveal grades (Anki-style).
export type Grade = 'again' | 'hard' | 'good' | 'easy';

// Which way a card is tested in the mixed-direction session.
export type Direction = 'fi-en' | 'en-fi';

// One vocabulary row, with the sheet row number so results can be written back.
export interface KnowledgeItem {
  rowNumber: number; // 1-based sheet row (header is row 1)
  finnish: string;
  translation: string;
  example: string | null; // user-owned `Example` column (learning language); read-only, null if absent
  lastTested: string | null; // ISO timestamp, or null
  intervalSeconds: number | null; // Review Interval in seconds; null = never reviewed (decision 004)
}

// What a graded review resolves to — exactly the app-owned columns we write (decision 004).
export interface ReviewState {
  lastTested: string; // ISO timestamp
  intervalSeconds: number; // seconds until next review
}

// A single card to present in a session.
export interface QuizCard {
  item: KnowledgeItem;
  direction: Direction;
}

// --- API contracts (shared by the routes and the client) ---
export interface QuizSessionResponse {
  cards: QuizCard[];
}

export interface QuizResultRequest {
  rowNumber: number;
  lastTested: string | null;
  intervalSeconds: number | null;
  grade: Grade;
}

export interface QuizResultResponse {
  ok: boolean;
  state?: ReviewState;
}
