import type { KnowledgeItem, ReviewState } from '../types';

// Reads vocabulary + knowledge and writes graded results back to the store.
// The Google Sheets implementation lives in adapters/.
export interface KnowledgeRepository {
  getAll(): Promise<KnowledgeItem[]>;
  // Writes the app-owned Last Tested / Review Interval for one row. Returns false on failure.
  recordResult(rowNumber: number, state: ReviewState): Promise<boolean>;
}
