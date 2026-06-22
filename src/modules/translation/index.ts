/**
 * translation — public API
 * Turns a word into a RichTranslation (base translation + Wiktionary lemma/POS/definitions).
 * Internals (services/, wiktionary/) are private; import only from here.
 */

export { fetchRichTranslation } from './services/richTranslationService';
export { default as TranslationSettingsPanel } from './components/TranslationSettingsPanel';
export {
  DEFAULT_SOURCE_ORDER,
  KNOWN_SOURCES,
  loadSourceOrder,
  saveSourceOrder,
  clearSourceOrder,
  parseSourceOrder,
  parseSourceOrderJson,
} from './settings';
export type { TranslationSource, SourceOrder } from './settings';
export type { RichTranslation, Definition, Example, PartOfSpeech } from './types';
export type { Translator } from './ports/Translator';
export type { Dictionary, DictionaryEntry } from './ports/Dictionary';
