const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

// Parses an already-resolved env string into a boolean; undefined -> fallback. Pure (no
// process.env access), so safe to share between config.server.ts and config.client.ts.
export function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return !FALSE_VALUES.has(value.trim().toLowerCase());
}
