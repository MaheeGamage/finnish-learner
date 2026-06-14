/**
 * vocab-test — public API
 * The knowledge-testing (quiz) feature. Two swappable ports — TestMechanism (how to grade /
 * schedule) and SessionSelector (what to test) — plus a KnowledgeRepository over the vocab
 * sheet. Default wiring in service.ts; client entry points for the UI below.
 */

export { fetchQuizSession, submitQuizResult } from './client';
export type { QuizSessionResult } from './client';
export type {
  Status,
  Grade,
  Direction,
  KnowledgeItem,
  ReviewState,
  QuizCard,
} from './types';
