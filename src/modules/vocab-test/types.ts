// Shared types for the knowledge-testing (quiz) feature.

// Knowledge status, mirrors VOCAB_STATUS values in the vocab-store sheet (decision 003).
export type Status = 'New' | 'Learning' | 'Known';

// Self-graded reveal grades (Anki-style).
export type Grade = 'again' | 'hard' | 'good' | 'easy';

// Which way a card is tested in the mixed-direction session.
export type Direction = 'fi-en' | 'en-fi';

// One vocabulary row, with the sheet row number so results can be written back.
export interface KnowledgeItem {
  rowNumber: number; // 1-based sheet row (header is row 1)
  finnish: string;
  translation: string;
  status: Status | null; // null = never set in the sheet
  lastTested: string | null; // ISO date (YYYY-MM-DD) or null
}

// What a graded review resolves to — exactly the app-owned columns we write.
export interface ReviewState {
  status: Status;
  lastTested: string; // ISO date
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
  status: Status | null;
  lastTested: string | null;
  grade: Grade;
}

export interface QuizResultResponse {
  ok: boolean;
  state?: ReviewState;
}
