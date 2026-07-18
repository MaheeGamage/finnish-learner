import { parseBooleanEnv } from './booleanEnv.ts';

// Client-safe app config — `NEXT_PUBLIC_*` only, safe to import anywhere including client
// components. Next.js inlines these at build time by matching the literal
// `process.env.NEXT_PUBLIC_X` expression below, so this can't be a dynamic name lookup (that's
// what config.server.ts's `requireEnv`/`optionalEnv` are for, and why they stay server-only).
export const config = {
  VOCAB_SAVING_ENABLED: parseBooleanEnv(process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED, true),
};
