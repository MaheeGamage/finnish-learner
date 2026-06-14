import type { SessionSelector, SelectOptions } from '../ports/SessionSelector';
import type { Direction, KnowledgeItem, QuizCard, Status } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PriorityConfig {
  // Fraction of the session (0–1) reserved for brand-new words, so a big New pile doesn't
  // crowd out reviews (and vice versa).
  newRatio: number;
  // Base weight per box — weaker words surface first.
  statusWeight: Record<Status, number>;
  // Contribution of overdueness, per day, capped at overdueCapDays.
  overdueWeightPerDay: number;
  overdueCapDays: number;
  // Random jitter added to each score so near-equal items don't appear in the same order
  // every session.
  jitter: number;
}

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  newRatio: 0.4,
  statusWeight: { New: 3, Learning: 2, Known: 1 },
  overdueWeightPerDay: 0.5,
  overdueCapDays: 30,
  jitter: 0.5,
};

const isNew = (item: KnowledgeItem) => item.lastTested === null;

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
        const status: Status = item.status ?? 'New';
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

      // Reserve up to newRatio of the session for new words, then fill from whichever pool
      // still has items.
      const newBudget = Math.min(news.length, Math.floor(size * config.newRatio));
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
