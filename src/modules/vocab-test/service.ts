import { createGoogleSheetsKnowledgeRepository } from './adapters/GoogleSheetsKnowledgeRepository';
import { createLeitnerMechanism } from './mechanisms/LeitnerMechanism';
import { createPrioritySessionSelector } from './selectors/PrioritySessionSelector';
import type { KnowledgeRepository } from './ports/KnowledgeRepository';
import type { SessionSelector } from './ports/SessionSelector';
import type { TestMechanism } from './ports/TestMechanism';

export const DEFAULT_SESSION_SIZE = 5;

export interface QuizService {
  repo: KnowledgeRepository;
  mechanism: TestMechanism;
  selector: SessionSelector;
}

// The default wiring of the swappable pieces — change the implementation here (or behind a
// flag) to switch SRS mechanism / selection strategy / store without touching the routes.
export function getQuizService(spreadsheetId: string): QuizService {
  return {
    repo: createGoogleSheetsKnowledgeRepository(spreadsheetId),
    mechanism: createLeitnerMechanism(),
    selector: createPrioritySessionSelector(),
  };
}
