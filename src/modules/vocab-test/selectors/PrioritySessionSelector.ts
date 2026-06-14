import type { SessionSelector, SelectOptions } from '../ports/SessionSelector';
import type { Direction, KnowledgeItem, QuizCard, Status } from '../types';
import { deriveStage, DEFAULT_KNOWN_THRESHOLD_SECONDS } from '../stage';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PriorityConfig {
  // Fraction of the session (0–1) reserved for brand-new words, so a big New pile doesn't
  // crowd out reviews (and vice versa).
  newRatio: number;
  // Base weight per derived stage — weaker words surface first.
  statusWeight: Record<Status, number>;
  // Contribution of overdueness, per day, capped at overdueCapDays.
  overdueWeightPerDay: number;
  overdueCapDays: number;
  // Random jitter added to each score so near-equal items don't appear in the same order
  // every session.
  jitter: number;
  // Interval (seconds) at/above which a word counts as Known for weighting (mirrors the sheet).
  knownThresholdSeconds: number;
  // Number of due Learning words at which new-word intake is throttled to zero — the new
  // budget scales linearly from full (no backlog) down to 0 at this count, so a large
  // learning backlog crowds out new words. Must be > 0.
  learningCapForNew: number;
}

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  newRatio: 0.4,
  statusWeight: { New: 3, Learning: 2, Known: 1 },
  overdueWeightPerDay: 0.5,
  overdueCapDays: 30,
  jitter: 0.5,
  knownThresholdSeconds: DEFAULT_KNOWN_THRESHOLD_SECONDS,
  learningCapForNew: 8,
};

const isNew = (item: KnowledgeItem) => !item.lastTested || item.intervalSeconds == null;

function randomDirection(): Direction {
  return Math.random() < 0.5 ? 'fi-en' : 'en-fi';
}

// "Most-overdue & weakest first": candidates are due reviews + new words, scored by status
// weakness + overdueness, with a cap on how much of the session is new words. All numbers
// are config — swap the whole strategy by providing a different SessionSelector.
export function createPrioritySessionSelector(
  config: PriorityConfig = DEFAULT_PRIORITY_CONFIG,
): SessionSelector {
  return {
    select(items: KnowledgeItem[], opts: SelectOptions): QuizCard[] {
      const { size, now, dueAt } = opts;

      const score = (item: KnowledgeItem): number => {
        const overdueDays = (now.getTime() - dueAt(item, now).getTime()) / MS_PER_DAY;
        const cappedOverdue = Math.min(Math.max(overdueDays, 0), config.overdueCapDays);
        const status: Status = deriveStage(item, config.knownThresholdSeconds);
        return (
          config.statusWeight[status] +
          cappedOverdue * config.overdueWeightPerDay +
          Math.random() * config.jitter
        );
      };

      // Candidate = due now (overdue ≥ 0). New items are due since epoch, so always candidates.
      const candidates = items
        .filter((item) => now.getTime() >= dueAt(item, now).getTime())
        .map((item) => ({ item, score: score(item) }))
        .sort((a, b) => b.score - a.score);

      const news = candidates.filter((c) => isNew(c.item));
      const reviews = candidates.filter((c) => !isNew(c.item));

      // Adaptive new-word budget: start from the newRatio cap, then scale it down by the
      // due-Learning backlog (focus on words being learned before adding new ones). Hits 0
      // once due-Learning ≥ learningCapForNew.
      const learningDue = reviews.filter(
        (c) => deriveStage(c.item, config.knownThresholdSeconds) === 'Learning',
      ).length;
      const pressure = Math.max(0, 1 - learningDue / config.learningCapForNew);
      const newBudget = Math.min(news.length, Math.floor(size * config.newRatio * pressure));
      // Remaining slots go to reviews; the backfill below tops up from any pool if short.
      const picked = [...news.slice(0, newBudget), ...reviews.slice(0, size - newBudget)];
      if (picked.length < size) {
        const used = new Set(picked.map((c) => c.item.rowNumber));
        for (const c of candidates) {
          if (picked.length >= size) break;
          if (!used.has(c.item.rowNumber)) picked.push(c);
        }
      }

      return picked
        .sort((a, b) => b.score - a.score)
        .slice(0, size)
        .map(({ item }): QuizCard => ({ item, direction: randomDirection() }));
    },
  };
}
