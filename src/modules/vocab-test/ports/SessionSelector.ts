import type { KnowledgeItem, QuizCard } from '../types';

export type DueFn = (item: KnowledgeItem, now: Date) => Date;

export interface SelectOptions {
  size: number;
  now: Date;
  // Supplied by the TestMechanism so the selector stays generic over the SRS rules.
  dueAt: DueFn;
}

// Swappable strategy for *what* to test: picks and orders the session queue from all items.
// Default impl is "most-overdue & weakest first"; can be replaced (random, new-only, etc.).
export interface SessionSelector {
  select(items: KnowledgeItem[], opts: SelectOptions): QuizCard[];
}
