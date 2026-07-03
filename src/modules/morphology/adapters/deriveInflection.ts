import type { Derivation, DerivationStep } from '../ports/MorphologyAnalyzer';

/**
 * Pure derivation engine: reconstructs how a Finnish base form became the surface
 * word, from Voikko's raw FST output + already-resolved feature labels.
 *
 * Kept free of any runtime imports (only `import type`) so it is unit-testable in
 * isolation — no WASM, no dictionary, no cross-module resolution. The Voikko-specific
 * wiring (feature → label lookup) lives in the adapter, which passes plain strings in.
 */

export interface DerivationInput {
  /** Dictionary base form, lowercased, e.g. "nukkua". */
  baseForm: string;
  /** Cleaned, lowercased surface word as it appears in the text, e.g. "nukun". */
  surfaceWord: string;
  /** Voikko `FSTOUTPUT`, e.g. "[Lt][Xp]nukkua[X]nuku[Tt][Ap][P1][Ny][Ef]n". */
  fstOutput: string | null;
  /** Resolved noun/pronoun case, or null. */
  case: { label: string; meaning: string } | null;
  /** Resolved person label ("1st" | "2nd" | "3rd" | "passive"), or null. */
  person: string | null;
  /** Resolved tense label ("present" | "past"), or null. */
  tense: string | null;
  /** Resolved non-indicative mood label ("conditional" | …), or null. */
  mood: string | null;
  /** True when the word is plural. */
  plural: boolean;
  /** Resolved participle label, or null. */
  participle: string | null;
  /** Resolved comparison label ("comparative" | "superlative"), or null. */
  comparison: string | null;
  /** Resolved possessive-suffix label, e.g. "+1p possessive", or null. */
  possessive: string | null;
}

const VOWELS = 'aeiouyäöå';
const isConsonant = (c: string | undefined): boolean => !!c && !VOWELS.includes(c);

/**
 * KPT consonant gradation strong↔weak pairs. Compared against the change at the
 * stem boundary; unknown changes (e.g. consonant-stem oddities) yield no gradation
 * step rather than a guess. Empty string = the consonant disappears (k→∅).
 */
const GRADATION_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['kk', 'k'], ['pp', 'p'], ['tt', 't'],
  ['nk', 'ng'], ['mp', 'mm'], ['nt', 'nn'], ['lt', 'll'], ['rt', 'rr'], ['nk', 'ng'],
  ['k', ''], ['p', 'v'], ['t', 'd'],
];

function commonPrefixLen(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

function trailingConsonants(s: string): string {
  let out = '';
  let i = s.length - 1;
  while (i >= 0 && isConsonant(s[i])) { out = s[i] + out; i--; }
  return out;
}

function leadingConsonants(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length && isConsonant(s[i])) { out += s[i]; i++; }
  return out;
}

/** Parsed pieces of an FSTOUTPUT string. */
interface FstParts {
  /** Base form as spelled inside `[Xp]…[X]` (last one, for compounds). */
  base: string;
  /** Literal surface stem right after the final `[X]`, e.g. "nuku". */
  stem: string;
  /** Realized inflectional ending (tags stripped), e.g. "n", "ssa", "illa". */
  ending: string;
}

/** Parse `FSTOUTPUT`; null if it lacks the `[Xp]…[X]` base marker. */
export function parseFstOutput(fst: string): FstParts | null {
  // Use the LAST [Xp]…[X] so compounds resolve on their inflected head.
  const re = /\[Xp\]([^[\]]*)\[X\]/g;
  let m: RegExpExecArray | null;
  let last: RegExpExecArray | null = null;
  while ((m = re.exec(fst)) !== null) last = m;
  if (!last) return null;

  const base = last[1];
  const afterX = fst.slice(last.index + last[0].length);
  const stem = (afterX.match(/^[^[]*/)?.[0]) ?? '';
  const ending = afterX.slice(stem.length).replace(/\[[^\]]*\]/g, '');
  return { base, stem, ending };
}

/** The consonant clusters on each side of the stem boundary (base vs surface stem). */
export function boundaryConsonants(base: string, stem: string): { bc: string; sc: string } {
  const n = commonPrefixLen(base, stem);
  const shared = trailingConsonants(base.slice(0, n));
  return {
    bc: shared + leadingConsonants(base.slice(n)),
    sc: shared + leadingConsonants(stem.slice(n)),
  };
}

/**
 * Classify the consonant change at the stem boundary between base and FST stem:
 *  - `'none'`      → no consonant change (base and stem differ only by vowels).
 *  - a pair object → a recognised KPT gradation (base→stem direction).
 *  - `'unknown'`   → a consonant changed but isn't a known gradation (consonant-stem
 *                    oddity); the caller should degrade rather than show a wrong story.
 */
export function detectGradation(
  base: string,
  stem: string,
): 'none' | 'unknown' | { from: string; to: string } {
  if (!base || !stem) return 'none';
  const { bc, sc } = boundaryConsonants(base, stem);
  if (bc === sc) return 'none';

  for (const [strong, weak] of GRADATION_PAIRS) {
    if ((bc === strong && sc === weak) || (bc === weak && sc === strong)) {
      return { from: bc, to: sc };
    }
  }
  return 'unknown';
}

/** Highlighted marker for a gradation step ("∅" when the consonant disappears). */
function gradationMarker(g: { from: string; to: string }): string {
  return `${g.from}→${g.to || '∅'}`;
}

/** Compact meaning fragment for the added ending, from resolved feature labels. */
function suffixMeaning(input: DerivationInput): string {
  const bits: string[] = [];
  if (input.case) {
    const num = input.plural ? ' · pl' : '';
    bits.push(`${input.case.label}${num} (${input.case.meaning})`);
  } else {
    if (input.person) bits.push(`${input.person} person`);
    if (input.plural) bits.push('pl');
    if (input.tense) bits.push(input.tense);
    if (input.mood) bits.push(input.mood);
    if (input.participle) bits.push(input.participle);
    if (input.comparison) bits.push(input.comparison);
  }
  if (input.possessive) bits.push(input.possessive);
  return bits.join(' · ');
}

/**
 * Build the base-form → surface-word derivation, or null to degrade gracefully.
 *
 * Confident only when the FST parse reconstructs the surface word and the ending
 * is a plausible inflectional length. Otherwise returns null so the tooltip falls
 * back to the existing base-form + summary display.
 */
export function buildDerivation(input: DerivationInput): Derivation | null {
  const { baseForm, surfaceWord, fstOutput } = input;
  if (!fstOutput || !baseForm) return null;

  const parts = parseFstOutput(fstOutput);
  if (!parts) return null;

  const { stem, ending } = parts;

  // Sanity: stem + ending must reconstruct the surface word. Guards against the
  // murky consonant-stem / derivational segmentations we'd rather not show a wrong
  // story for (those fail to reconstruct, e.g. käden, punaisella).
  if (stem + ending !== surfaceWord) return null;

  const change = detectGradation(baseForm, stem);
  // An unexplained consonant change means the FST folded stem material into the
  // ending (consonant-stem words like käsi→kä+den); degrade rather than mislabel.
  if (change === 'unknown') return null;
  const gradation = change === 'none' ? null : change;

  // Nothing changed → it's already the base form; no derivation to show.
  if (!ending && !gradation) return null;

  const steps: DerivationStep[] = [
    { kind: 'base', marker: '', detail: 'base form', result: baseForm },
  ];

  if (gradation && stem !== baseForm) {
    steps.push({
      kind: 'gradation',
      marker: gradationMarker(gradation),
      detail: 'consonant gradation',
      result: `${stem}-`,
    });
  }

  if (ending) {
    steps.push({
      kind: 'suffix',
      marker: `-${ending}`,
      detail: suffixMeaning(input),
      result: surfaceWord,
    });
  }

  // A one-step chain (base → base) carries nothing useful.
  if (steps.length < 2) return null;

  const gradFragment = gradation ? `${gradation.from}→${gradation.to || '∅'} + ` : '';
  const shortMeaning = summaryTag(input);
  const summary =
    `${baseForm} · ${gradFragment}-${ending}` + (shortMeaning ? ` (${shortMeaning})` : '');

  return { summary, steps };
}

/** Very short feature tag for the compact summary, e.g. "1st sg", "inessive". */
function summaryTag(input: DerivationInput): string {
  if (input.case) return input.case.label + (input.plural ? ' pl' : '');
  const bits: string[] = [];
  if (input.person) bits.push(input.person);
  bits.push(input.plural ? 'pl' : input.person ? 'sg' : '');
  if (input.tense) bits.push(input.tense);
  return bits.filter(Boolean).join(' ');
}
