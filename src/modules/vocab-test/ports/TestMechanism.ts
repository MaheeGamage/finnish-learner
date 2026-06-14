import type { Grade, KnowledgeItem, ReviewState } from '../types';

// Swappable testing mechanism: how a grade updates knowledge, and when an item is next due.
// Default impl is Leitner; could be replaced later (e.g. SM-2, Anki-backed) without changing
// the rest of the system (see decision 002 + the modular-mechanism constraint).
export interface TestMechanism {
  // The new knowledge state after the user grades a card.
  grade(item: KnowledgeItem, grade: Grade, now: Date): ReviewState;
  // When this item should next be reviewed (drives session selection).
  dueAt(item: KnowledgeItem, now: Date): Date;
}
