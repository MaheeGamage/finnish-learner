import type { Dictionary } from '../ports/Dictionary';
import { wiktionaryDictionary } from '../adapters/wiktionary/WiktionaryDictionary';
import { translate } from './translator';
import { RichTranslation } from '../types';

const dictionary: Dictionary = wiktionaryDictionary;

export async function fetchRichTranslation(
  word: string,
  lang: string
): Promise<RichTranslation> {
  try {
    const entry = await dictionary.lookup(word, lang);

    if (entry) {
      return {
        word,
        language: lang,
        lemma: entry.lemma,
        grammaticalForm: entry.grammaticalForm,
        partOfSpeech: entry.partOfSpeech,
        definitions: entry.definitions,
        pronunciation: entry.pronunciation,
        fallbackTranslation: null,
        source: 'wiktapi',
        fetchedAt: new Date().toISOString(),
      };
    }

    return await createFallbackTranslation(word, lang);
  } catch (error) {
    console.warn('[RichTranslation] Dictionary lookup failed, using fallback:', {
      word,
      lang,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return await createFallbackTranslation(word, lang);
  }
}

export async function createFallbackTranslation(
  word: string,
  lang: string
): Promise<RichTranslation> {
  try {
    const fallbackTranslation = await translate(word, lang as 'en' | 'fi', 'en');
    return {
      word,
      language: lang,
      lemma: null,
      grammaticalForm: null,
      partOfSpeech: null,
      definitions: [],
      pronunciation: null,
      fallbackTranslation,
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[RichTranslation] All translators failed:', {
      word,
      lang,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      word,
      language: lang,
      lemma: null,
      grammaticalForm: null,
      partOfSpeech: null,
      definitions: [],
      pronunciation: null,
      fallbackTranslation: null,
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
    };
  }
}
