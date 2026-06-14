// ⚠️ NOT IN USE. Kept around as an alternative mechanism while the test algorithm is being
// finalised — the default service wires up IntervalMechanism, not this. Safe to delete once
// the SRS approach is settled. Conforms to the current TestMechanism interface so it can be
// swapped into service.ts in one line for comparison.

import type { TestMechanism } from '../ports/TestMechanism';
import type { Grade, KnowledgeItem, ReviewState, Status } from '../types';

const SECONDS_PER_DAY = 86_400;

// Per-box interval until an item is due again, in seconds (matches Review Interval). Tunable.
export interface LeitnerConfig {
  intervals: Record<Status, number>;
}

export const DEFAULT_LEITNER_CONFIG: LeitnerConfig = {
  intervals: { New: 0, Learning: 2 * SECONDS_PER_DAY, Known: 7 * SECONDS_PER_DAY },
};

const ORDER: Status[] = ['New', 'Learning', 'Known'];

function promote(status: Status): Status {
  const i = ORDER.indexOf(status);
  return ORDER[Math.min(i + 1, ORDER.length - 1)];
}

// The app no longer stores Status (decision 004) — recover the Leitner box from the interval
// this mechanism itself wrote (the per-box intervals are distinct). Unknown → Learning.
function boxFromInterval(intervalSeconds: number | null, config: LeitnerConfig): Status {
  if (intervalSeconds == null) return 'New';
  const match = (Object.entries(config.intervals) as [Status, number][]).find(
    ([, secs]) => secs === intervalSeconds,
  );
  return match ? match[0] : 'Learning';
}

// Kept as an alternative mechanism while the test algorithm is being finalised; not wired into
// the default service (that uses IntervalMechanism). Box-based Leitner, conforming to the
// seconds/timestamp ReviewState: grade moves the box; the box's interval is what gets stored.
export function createLeitnerMechanism(
  config: LeitnerConfig = DEFAULT_LEITNER_CONFIG,
): TestMechanism {
  return {
    grade(item: KnowledgeItem, grade: Grade, now: Date): ReviewState {
      const current = boxFromInterval(item.intervalSeconds, config);
      let next: Status;
      // Again resets to New; Hard lands in Learning (promotes New→Learning, holds Learning,
      // demotes a struggled Known); Good steps up one box; Easy jumps to Known.
      switch (grade) {
        case 'again':
          next = 'New';
          break;
        case 'hard':
          next = 'Learning';
          break;
        case 'good':
          next = promote(current);
          break;
        case 'easy':
          next = 'Known';
          break;
      }
      return { lastTested: now.toISOString(), intervalSeconds: config.intervals[next] };
    },

    dueAt(item: KnowledgeItem, _now: Date): Date {
      // Never reviewed → due "forever ago" so new words sort as maximally overdue candidates.
      if (!item.lastTested || item.intervalSeconds == null) return new Date(0);
      const last = new Date(item.lastTested);
      if (Number.isNaN(last.getTime())) return new Date(0);
      return new Date(last.getTime() + item.intervalSeconds * 1000);
    },
  };
}
