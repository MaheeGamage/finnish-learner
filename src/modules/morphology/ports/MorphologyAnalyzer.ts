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
}

export interface MorphologyAnalyzer {
  init(): Promise<void>;
  /** Synchronous once initialised — WASM call, no network after init. */
  analyse(word: string): MorphologyResult | null;
  terminate(): void;
}
