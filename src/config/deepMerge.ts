// Deep merge for nested config partials. Pure and dependency-free so the merge semantics — the
// part every provider's precedence depends on — can be unit-tested on their own.
//
// Semantics: `override` wins, but only where it actually says something. A nested plain object is
// merged key by key so a partial like `{ vocabTest: { srsTuning: … } }` leaves sibling groups
// alone; anything else (primitive, array, null) replaces wholesale. `undefined` never clobbers a
// value — a provider omitting a key must not wipe the layer below it.

export type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

// Plain object = mergeable. Arrays are deliberately excluded: a saved list (e.g. translation
// source order) must replace the default outright, not merge index-by-index into it.
export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function mergeUnknown(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) return override;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    out[key] = mergeUnknown(out[key], value);
  }
  return out;
}

export function deepMerge<T>(base: T, override: DeepPartial<T>): T {
  return mergeUnknown(base, override) as T;
}
