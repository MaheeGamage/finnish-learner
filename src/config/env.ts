// Server-only raw env access. Only used inside config.server.ts entries that are in fact
// env-backed — never import this from config.client.ts. Client-safe (`NEXT_PUBLIC_*`) reads
// must use a literal `process.env.NEXT_PUBLIC_X` member expression instead of a dynamic name
// lookup, since Next.js inlines those at build time by matching the literal expression.

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}
