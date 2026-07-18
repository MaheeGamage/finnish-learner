import { requireEnv } from './env.ts';
import { parseBooleanEnv } from './booleanEnv.ts';

// Server-only app config — a facade. Each entry is declared once, named after the thing it
// represents; how it's actually resolved (env var here, a plain constant or a DB row later) is
// this module's own business, never something callers need to know or change when the source
// moves. Resolved eagerly at import — a missing required entry throws immediately (fail fast at
// startup) rather than only when some later code path happens to read it.
//
// Never import this from a client component — see config.client.ts for the client-safe side.
export const config = {
  AUTH_GOOGLE_ID: requireEnv('AUTH_GOOGLE_ID'),
  AUTH_GOOGLE_SECRET: requireEnv('AUTH_GOOGLE_SECRET'),
  VOCAB_SAVING_ENABLED: parseBooleanEnv(process.env.NEXT_PUBLIC_VOCAB_SAVING_ENABLED, true),
};
