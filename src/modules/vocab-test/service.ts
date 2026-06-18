import { createGoogleSheetsKnowledgeRepository } from './adapters/GoogleSheetsKnowledgeRepository';
import { createIntervalMechanism } from './mechanisms/IntervalMechanism';
import { createPrioritySessionSelector, DEFAULT_PRIORITY_CONFIG } from './selectors/PrioritySessionSelector';
import { DEFAULT_TUNING, type TuningConfig } from './settings';
import type { KnowledgeRepository } from './ports/KnowledgeRepository';
import type { SessionSelector } from './ports/SessionSelector';
import type { TestMechanism } from './ports/TestMechanism';

export interface QuizService {
  repo: KnowledgeRepository;
  mechanism: TestMechanism;
  selector: SessionSelector;
}

// The default wiring of the swappable pieces — change the implementation here (or behind a
// flag) to switch SRS mechanism / selection strategy / store without touching the routes.
// `tuning` carries the user's editable settings (task-011); it defaults to DEFAULT_TUNING so
// the service still works standalone. sessionSize is read by the route from the same config.
export function getQuizService(
  spreadsheetId: string,
  tuning: TuningConfig = DEFAULT_TUNING,
): QuizService {
  return {
    repo: createGoogleSheetsKnowledgeRepository(spreadsheetId),
    mechanism: createIntervalMechanism({
      firstReview: tuning.firstReview,
      multiplier: tuning.multiplier,
    }),
    selector: createPrioritySessionSelector({
      ...DEFAULT_PRIORITY_CONFIG,
      knownThresholdSeconds: tuning.knownThresholdSeconds,
    }),
  };
}
