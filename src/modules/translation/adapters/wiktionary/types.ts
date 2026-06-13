/**
 * WiktApi response type definitions
 * These types match the structure returned by api.wiktapi.dev
 */

/**
 * Example sentence from WiktApi
 */
export interface WiktApiExample {
  /** Example sentence in the target language */
  text: string;
  /** English translation of the example (optional) */
  translation?: string;
}

/**
 * Indicates this sense represents an inflected form of another word
 */
export interface WiktApiFormOf {
  /** The base word (lemma) */
  word: string;
}

/**
 * A single sense (meaning) of a word entry
 */
export interface WiktApiSense {
  /** Definition glosses (meanings) */
  glosses?: string[];
  /** Example sentences illustrating this sense */
  examples?: WiktApiExample[];
  /** Indicates this is an inflected form of another word */
  form_of?: WiktApiFormOf[];
  /** Grammatical tags (case, number, tense, etc.) */
  tags?: string[];
}

/**
 * Pronunciation data from WiktApi
 */
export interface WiktApiSound {
  /** IPA notation for pronunciation */
  ipa?: string;
  /** Audio file URL */
  audio?: string;
}

/**
 * Inflected form of a word
 */
export interface WiktApiForm {
  /** The inflected form */
  form: string;
  /** Grammatical tags describing this form */
  tags?: string[];
}

/**
 * A single dictionary entry from WiktApi
 * A word may have multiple entries (e.g., as different parts of speech)
 */
export interface WiktApiEntry {
  /** Part of speech code (e.g., 'n', 'v', 'adj') */
  pos?: string;
  /** Word senses (definitions) */
  senses: WiktApiSense[];
  /** Pronunciation data */
  sounds?: WiktApiSound[];
  /** Inflected forms of this word */
  forms?: WiktApiForm[];
}

/**
 * Full WiktApi response structure
 * Response from api.wiktapi.dev/v1/en/word/{word}?lang={lang}
 */
export interface WiktApiResponse {
  /** The word that was queried */
  word: string;
  /** Dictionary entries for this word */
  entries: WiktApiEntry[];
}