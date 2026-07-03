/**
 * One checkpoint in the base-form → surface-word transformation. Split so the UI
 * can style the highlighted token distinctly (amber for gradation, indigo for an
 * ending) without parsing strings.
 */
export interface DerivationStep {
  /** What kind of change this step is — drives styling. */
  kind: 'base' | 'gradation' | 'suffix';
  /** Highlighted token: "" for the base, e.g. "kk→k" (gradation) or "-n" (ending). */
  marker: string;
  /** Rest of the explanation, e.g. "consonant gradation", "inessive (in/inside)". */
  detail: string;
  /** Word form after this step is applied, e.g. "nuku-", "nukun". */
  result: string;
}

/**
 * Step-by-step account of how the base form became the word on screen.
 * `summary` is a compact one-line version for the collapsed tooltip; `steps`
 * is the expandable chain (first entry is always the base form).
 */
export interface Derivation {
  summary: string;
  steps: DerivationStep[];
}

export interface MorphologyResult {
  /** Base dictionary form of the word, e.g. "talo" for "talossa". */
  baseForm: string;
  /** English word class, e.g. "noun", "verb". Null if unknown. */
  wordClass: string | null;
  /**
   * Compact one-line description of the grammatical transformation,
   * e.g. "inessive · plural" or "past · 3rd · conditional".
   * Null when the word is already in its base/nominative singular form.
   */
  formSummary: string | null;
  /**
   * Canonical case suffix string, e.g. "-ssa/-ssä" for inessive.
   * Present only for noun cases; null for verbs and base forms.
   */
  suffix: string | null;
  /**
   * Short English meaning of the case/form, e.g. "in/inside" for inessive.
   * Present only for noun cases with a meaningful translation; null otherwise.
   */
  meaning: string | null;
  /**
   * Step-by-step derivation from base form to the surface word (affixes + KPT
   * consonant gradation). Null when the analyser can't build a confident chain —
   * callers degrade to baseForm + formSummary. See {@link Derivation}.
   */
  derivation: Derivation | null;
}

export interface MorphologyAnalyzer {
  init(): Promise<void>;
  /** Synchronous once initialised — WASM call, no network after init. */
  analyse(word: string): MorphologyResult | null;
  terminate(): void;
}
