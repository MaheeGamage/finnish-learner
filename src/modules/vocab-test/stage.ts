import type { KnowledgeItem, Status } from './types';

// Seconds at/above which a word reads as Known. Mirrors the sheet's Status formula threshold
// (21 days). In seconds so it lines up with the seconds-based Review Interval.
export const DEFAULT_KNOWN_THRESHOLD_SECONDS = 21 * 86_400;

// Derive the learning stage from scheduling state (decision 004) — the app never stores it.
// New = never reviewed; Known = interval grown past the threshold; else Learning.
export function deriveStage(
  item: KnowledgeItem,
  knownThresholdSeconds: number = DEFAULT_KNOWN_THRESHOLD_SECONDS,
): Status {
  if (!item.lastTested || item.intervalSeconds == null) return 'New';
  return item.intervalSeconds >= knownThresholdSeconds ? 'Known' : 'Learning';
}
