import type { SessionSelector, SelectOptions } from '../ports/SessionSelector';
import { STAGE, type Direction, type KnowledgeItem, type QuizCard, type Status } from '../types';
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
  // Total-Learning WIP cap (task-014): the size of the entire Learning set — due *or not* —
  // at which new-word intake is throttled to zero. Unlike learningCapForNew (which counts only
  // *due* Learning words), this counts every word currently in the Learning stage, so it keeps
  // firing during back-to-back sittings when just-graded words aren't due yet. The two throttles
  // combine (the stricter one wins). Must be > 0.
  learningWipCap: number;
}

export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  newRatio: 0.4,
  statusWeight: { New: 3, Learning: 2, Known: 1 },
  overdueWeightPerDay: 0.5,
  overdueCapDays: 30,
  jitter: 0.5,
  knownThresholdSeconds: DEFAULT_KNOWN_THRESHOLD_SECONDS,
  learningCapForNew: 8,
  learningWipCap: 30,
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

      // Adaptive new-word budget: start from the newRatio cap, then scale it down by two
      // independent Learning pressures — the stricter (smaller) one wins. Focus on words already
      // being learned before adding new ones.
      //   (1) due-Learning backlog: overdue reviews crowd out new words this session.
      //   (2) total-Learning WIP (task-014): the whole in-flight Learning set, due *or not*, so
      //       back-to-back sittings can't keep pulling in new words after grading pushes their
      //       due dates out. Counted over every item, not just this session's candidates.
      const learningDue = reviews.filter(
        (c) => deriveStage(c.item, config.knownThresholdSeconds) === STAGE.Learning,
      ).length;
      const learningTotal = items.filter(
        (item) => deriveStage(item, config.knownThresholdSeconds) === STAGE.Learning,
      ).length;
      const duePressure = Math.max(0, 1 - learningDue / config.learningCapForNew);
      const wipPressure = Math.max(0, 1 - learningTotal / config.learningWipCap);
      const pressure = Math.min(duePressure, wipPressure);
      const newBudget = Math.min(news.length, Math.floor(size * config.newRatio * pressure));
      // Hard ceiling on how many new words may enter this session *including backfill*. Scales
      // with the same pressure, so when the Learning set is full (pressure → 0) the backfill can
      // no longer pad an otherwise-empty session with new words — it returns fewer cards (or
      // none) instead, per task-014. Always ≥ newBudget since newRatio ≤ 1.
      const newCeiling = Math.floor(size * pressure);
      // Remaining slots go to reviews; the backfill below tops up if short — freely with reviews
      // (always due), but with new words only up to newCeiling.
      const picked = [...news.slice(0, newBudget), ...reviews.slice(0, size - newBudget)];
      if (picked.length < size) {
        const used = new Set(picked.map((c) => c.item.rowNumber));
        let newsPicked = picked.filter((c) => isNew(c.item)).length;
        for (const c of candidates) {
          if (picked.length >= size) break;
          if (used.has(c.item.rowNumber)) continue;
          if (isNew(c.item)) {
            if (newsPicked >= newCeiling) continue;
            newsPicked++;
          }
          picked.push(c);
        }
      }

      return picked
        .sort((a, b) => b.score - a.score)
        .slice(0, size)
        .map(({ item }): QuizCard => ({ item, direction: randomDirection() }));
    },
  };
}
