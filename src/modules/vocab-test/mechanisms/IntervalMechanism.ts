import type { TestMechanism } from '../ports/TestMechanism';
import type { Grade, KnowledgeItem, ReviewState } from '../types';

const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_MINUTE = 60;

// Interval-based SRS (decision 004). The stored knowledge state is a per-word interval in
// **seconds** (fine-grained so the loop can be tuned/tested without waiting days); due =
// Last Tested (a full timestamp) + interval. Status is NOT written by the app — it's derived
// (see stage.ts / the sheet formula). SM-2 "lite": fixed grade behaviour, no per-word ease.
export interface IntervalConfig {
  // Interval (seconds) assigned on a word's first review, per grade.
  firstReview: Record<Grade, number>;
  // Multiplier applied to the previous interval on later reviews (again resets to firstReview).
  multiplier: Record<Grade, number>;
}

// Mirrors PRESETS.standard in settings.ts (the app passes the user's tuning explicitly; this is
// the intrinsic fallback for standalone construction). Day-scale so a `good`-graded word grows
// past the 21-day Known threshold in ~5 reviews — the old minute-scale defaults never did.
export const DEFAULT_INTERVAL_CONFIG: IntervalConfig = {
  firstReview: {
    again: 1 * SECONDS_PER_MINUTE,
    hard: 10 * SECONDS_PER_MINUTE,
    good: 1 * SECONDS_PER_DAY,
    easy: 4 * SECONDS_PER_DAY,
  },
  multiplier: { again: 0, hard: 1.2, good: 2.5, easy: 3.5 },
};

export function createIntervalMechanism(
  config: IntervalConfig = DEFAULT_INTERVAL_CONFIG,
): TestMechanism {
  return {
    grade(item: KnowledgeItem, grade: Grade, now: Date): ReviewState {
      const prev = item.lastTested && item.intervalSeconds != null ? item.intervalSeconds : null;
      let interval: number;
      if (prev == null) {
        interval = config.firstReview[grade]; // first review
      } else if (grade === 'again') {
        interval = config.firstReview.again; // failed — short interval, but still being learned
      } else {
        interval = Math.max(prev + 1, Math.round(prev * config.multiplier[grade]));
      }
      return { lastTested: now.toISOString(), intervalSeconds: interval };
    },

    dueAt(item: KnowledgeItem, _now: Date): Date {
      // Never reviewed → due "forever ago" so untested words sort as maximally overdue.
      if (!item.lastTested || item.intervalSeconds == null) return new Date(0);
      const last = new Date(item.lastTested);
      if (Number.isNaN(last.getTime())) return new Date(0);
      return new Date(last.getTime() + item.intervalSeconds * 1000);
    },
  };
}
