import type { TestMechanism } from '../ports/TestMechanism';
import type { Grade, KnowledgeItem, ReviewState, Status } from '../types';

// Days until an item in each box is due again. Tunable.
export interface LeitnerConfig {
  intervals: Record<Status, number>;
}

export const DEFAULT_LEITNER_CONFIG: LeitnerConfig = {
  intervals: { New: 0, Learning: 2, Known: 7 },
};

const ORDER: Status[] = ['New', 'Learning', 'Known'];

function promote(status: Status): Status {
  const i = ORDER.indexOf(status);
  return ORDER[Math.min(i + 1, ORDER.length - 1)];
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

// Simple Leitner SRS over the sheet's existing Status box + Last Tested date (decision 003,
// no extra columns). Grade moves the box; due date = Last Tested + interval(Status).
export function createLeitnerMechanism(
  config: LeitnerConfig = DEFAULT_LEITNER_CONFIG,
): TestMechanism {
  return {
    grade(item: KnowledgeItem, grade: Grade, now: Date): ReviewState {
      const current: Status = item.status ?? 'New';
      let next: Status;
      // Any recall above "Again" makes progress. Again resets to New; Hard lands in the
      // Learning zone (promotes New→Learning, holds Learning, demotes a struggled Known);
      // Good steps up one box; Easy jumps to Known.
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
      return { status: next, lastTested: toISODate(now) };
    },

    dueAt(item: KnowledgeItem, _now: Date): Date {
      // Never tested → due "forever ago" so new words sort as maximally overdue candidates.
      if (!item.lastTested) return new Date(0);
      const status: Status = item.status ?? 'New';
      const last = new Date(item.lastTested);
      if (Number.isNaN(last.getTime())) return new Date(0);
      return addDays(last, config.intervals[status]);
    },
  };
}
