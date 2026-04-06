/**
 * Part of speech types for word classification
 * Validated by WiktAPI or derived from fallback translation
 */
export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'numeral'
  | 'particle';

/**
 * Example sentence for a definition
 */
export interface Example {
  /** The example sentence in the target language */
  text: string;
  /** Translation of the example sentence, null if unavailable */
  translation: string | null;
}

/**
 * A single definition of a word
 */
export interface Definition {
  /** The definition text */
  text: string;
  /** Example sentences illustrating this definition */
  examples: Example[];
}

/**
 * Rich translation data returned from WiktAPI or fallback translation
 * Contains comprehensive lexical information for language learning
 */
export interface RichTranslation {
  /** The originally selected word */
  word: string;
  /** ISO 639-1 language code */
  language: string;
  /** Base word (lemma) if the word is an inflected form */
  lemma: string | null;
  /** Description of grammatical relationship to lemma (e.g., "present tense, 1st person singular") */
  grammaticalForm: string | null;
  /** Part of speech classification */
  partOfSpeech: PartOfSpeech | null;
  /** Word definitions with examples */
  definitions: Definition[];
  /** IPA pronunciation notation */
  pronunciation: string | null;
  /** Fallback simple translation when rich data unavailable */
  fallbackTranslation: string | null;
  /** Source of the translation data */
  source: 'wiktapi' | 'fallback';
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: string;
}