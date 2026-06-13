/**
 * translation — public API
 * Turns a word into a RichTranslation (base translation + Wiktionary lemma/POS/definitions).
 * Internals (services/, wiktionary/) are private; import only from here.
 */

export { fetchRichTranslation } from './services/richTranslationService';
export type { RichTranslation, Definition, Example, PartOfSpeech } from './types';
