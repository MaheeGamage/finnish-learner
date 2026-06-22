// User-configurable translation source order (task-013). The reader can resolve a word from two
// sources — Google Translate (plain translation) and Wiktionary (rich lemma/POS/definitions).
// They're tried in this order with PURE PRIORITY: the first source that returns a usable result
// wins, the rest are skipped. Default is Google-first (Wiktionary's been unreliable).
//
// Mirrors the SRS settings module: pure pieces (types, parse/validate) are isomorphic; only
// load/save/clear touch localStorage and must run in the browser. MyMemory is not a source here —
// it stays Google's internal fallback inside the Translator chain.

export type TranslationSource = 'google' | 'wiktionary';

// All sources, in the default order. A valid SourceOrder is a permutation of exactly these.
export const KNOWN_SOURCES: readonly TranslationSource[] = ['google', 'wiktionary'];

export type SourceOrder = TranslationSource[];

export const DEFAULT_SOURCE_ORDER: SourceOrder = ['google', 'wiktionary'];

const STORAGE_KEY = 'finnish_translation_source_order';

const isKnownSource = (v: unknown): v is TranslationSource =>
  typeof v === 'string' && (KNOWN_SOURCES as readonly string[]).includes(v);

// Coerce any list into a complete SourceOrder: keep the known sources in the order given (deduped,
// unknown entries dropped), then append any known source that was missing, in KNOWN_SOURCES order.
// This keeps saved orders forward-compatible — adding a new translator preserves the user's
// existing ranking and just appends the newcomer last, instead of resetting everything.
export function normalizeSourceOrder(sources: readonly unknown[]): SourceOrder {
  const seen = new Set<TranslationSource>();
  const order: SourceOrder = [];
  for (const v of sources) {
    if (isKnownSource(v) && !seen.has(v)) {
      seen.add(v);
      order.push(v);
    }
  }
  for (const s of KNOWN_SOURCES) {
    if (!seen.has(s)) order.push(s);
  }
  return order;
}

// Validate an untrusted value into a SourceOrder, or null if it isn't a list at all. Any array is
// accepted and normalized (see above), so a stale saved order from a different set of sources still
// loads sensibly rather than being thrown away.
export function parseSourceOrder(raw: unknown): SourceOrder | null {
  if (!Array.isArray(raw)) return null;
  return normalizeSourceOrder(raw);
}

export function parseSourceOrderJson(raw: string | null): SourceOrder | null {
  if (!raw) return null;
  try {
    return parseSourceOrder(JSON.parse(raw));
  } catch {
    return null;
  }
}

// --- localStorage (browser only) ---

export function loadSourceOrder(): SourceOrder {
  try {
    return parseSourceOrderJson(localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_SOURCE_ORDER;
  } catch {
    return DEFAULT_SOURCE_ORDER;
  }
}

export function saveSourceOrder(order: SourceOrder): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch (error) {
    console.error('Error saving translation source order:', error);
  }
}

export function clearSourceOrder(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing translation source order:', error);
  }
}
