// User-tunable quiz settings (task-011, task-020). The tunable groups — first-review intervals,
// growth multipliers, the Known threshold, session size, and the question-direction mix — live
// here as the single source of truth, along with the presets and the validator. Three named
// presets ship as starting points plus a Custom profile (any edit → Custom).
//
// Persistence is NOT here (task-018): the active value is served by the config facade
// (`config.client.ts`, entry `SRS_TUNING` declared in `entries.client.ts`), which owns where it's
// stored and validates it through `parseTuning` below. This module stays the owner of the shape,
// the defaults, and the validation; it just doesn't know the storage medium.
//
// Base unit is SECONDS everywhere (decision 004). Fully isomorphic — every export here runs on
// client and server alike, which is what lets the quiz API routes validate the `x-srs-tuning`
// header with `parseTuningJson` / `DEFAULT_TUNING`.
import type { Grade } from './types';

const MINUTE = 60;
const HOUR = 3_600;
const DAY = 86_400;

const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

// Recognition/production split when nothing is set — an even mix (task-020).
export const DEFAULT_RECOGNITION_RATIO = 0.5;

// The complete tuning state. firstReview + knownThresholdSeconds are in seconds.
export interface TuningConfig {
  firstReview: Record<Grade, number>; // interval (s) on a word's first review, per grade
  multiplier: Record<Grade, number>; // factor applied to the interval on later reviews
  knownThresholdSeconds: number; // interval (s) at/above which a word reads as Known
  sessionSize: number; // cards per quiz session
  recognitionRatio: number; // share of cards (0–1) testing recognition; the rest test production
}

export type PresetName = 'standard' | 'brisk' | 'rapid';
export type ProfileName = PresetName | 'custom';

// Each preset scales the whole timeline — all reach Known in ~5 correct `good` reviews, but at
// progressively shorter real-world spacing. Keep in sync with task-011's preset tables.
export const PRESETS: Record<PresetName, TuningConfig> = {
  standard: {
    firstReview: { again: 1 * MINUTE, hard: 10 * MINUTE, good: 1 * DAY, easy: 4 * DAY },
    multiplier: { again: 0, hard: 1.2, good: 2.5, easy: 3.5 },
    knownThresholdSeconds: 21 * DAY,
    sessionSize: 5,
    recognitionRatio: DEFAULT_RECOGNITION_RATIO,
  },
  brisk: {
    firstReview: { again: 1 * MINUTE, hard: 5 * MINUTE, good: 6 * HOUR, easy: 1 * DAY },
    multiplier: { again: 0, hard: 1.2, good: 2.2, easy: 3 },
    knownThresholdSeconds: 5 * DAY,
    sessionSize: 5,
    recognitionRatio: DEFAULT_RECOGNITION_RATIO,
  },
  rapid: {
    firstReview: { again: 30, hard: 2 * MINUTE, good: 1 * HOUR, easy: 6 * HOUR },
    multiplier: { again: 0, hard: 1.2, good: 2, easy: 2.5 },
    knownThresholdSeconds: 1 * DAY,
    sessionSize: 5,
    recognitionRatio: DEFAULT_RECOGNITION_RATIO,
  },
};

export const DEFAULT_PRESET: PresetName = 'standard';
export const DEFAULT_TUNING: TuningConfig = PRESETS[DEFAULT_PRESET];

const isPositiveFinite = (v: unknown, min: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min;

function parseGradeRecord(raw: unknown, min: number): Record<Grade, number> | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const out = {} as Record<Grade, number>;
  for (const g of GRADES) {
    if (!isPositiveFinite(obj[g], min)) return null;
    out[g] = obj[g] as number;
  }
  return out;
}

// Validate an untrusted value (localStorage or a request header) into a TuningConfig, or null.
// Server-side callers fall back to DEFAULT_TUNING on null, so a bad client payload can't break
// a quiz or smuggle absurd values through.
export function parseTuning(raw: unknown): TuningConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const firstReview = parseGradeRecord(obj.firstReview, 1); // intervals must be ≥ 1 s
  const multiplier = parseGradeRecord(obj.multiplier, 0); // `again` resets, so 0 is valid
  if (!firstReview || !multiplier) return null;
  if (!isPositiveFinite(obj.knownThresholdSeconds, 1)) return null;
  const size = obj.sessionSize;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1 || size > 100) return null;
  // Added after the field already had stored values (task-020): absent means "written before this
  // existed", so it takes the default rather than invalidating the whole config. Present but
  // out of range is still rejected — that's a bad payload, not an old one.
  const ratio = obj.recognitionRatio ?? DEFAULT_RECOGNITION_RATIO;
  if (typeof ratio !== 'number' || !Number.isFinite(ratio) || ratio < 0 || ratio > 1) return null;
  return {
    firstReview,
    multiplier,
    knownThresholdSeconds: obj.knownThresholdSeconds,
    sessionSize: size,
    recognitionRatio: ratio,
  };
}

// Same, but from a JSON string (request header / stored blob). Tolerates null/garbage.
export function parseTuningJson(raw: string | null): TuningConfig | null {
  if (!raw) return null;
  try {
    return parseTuning(JSON.parse(raw));
  } catch {
    return null;
  }
}

function gradesEqual(a: Record<Grade, number>, b: Record<Grade, number>): boolean {
  return GRADES.every((g) => a[g] === b[g]);
}

// Which profile the config corresponds to — a matching preset name, or 'custom' if hand-tuned.
// `recognitionRatio` is deliberately not compared: presets are spacing timelines, and the direction mix
// is orthogonal to pace, so changing it must not push the user into Custom.
export function profileOf(config: TuningConfig): ProfileName {
  for (const name of Object.keys(PRESETS) as PresetName[]) {
    const p = PRESETS[name];
    if (
      config.knownThresholdSeconds === p.knownThresholdSeconds &&
      config.sessionSize === p.sessionSize &&
      gradesEqual(config.firstReview, p.firstReview) &&
      gradesEqual(config.multiplier, p.multiplier)
    ) {
      return name;
    }
  }
  return 'custom';
}
