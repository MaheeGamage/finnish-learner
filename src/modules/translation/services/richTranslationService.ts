import type { Dictionary } from '../ports/Dictionary';
import { wiktionaryDictionary } from '../adapters/wiktionary/WiktionaryDictionary';
import { translate } from './translator';
import { RichTranslation } from '../types';
import { loadSourceOrder, type TranslationSource } from '../settings';

const dictionary: Dictionary = wiktionaryDictionary;

// Each source resolves a word into a RichTranslation, or null when it has nothing usable.
// Pure priority: fetchRichTranslation tries them in the user's configured order and the first
// non-null result wins (the rest are skipped). Resolvers swallow their own errors → null so a
// failing source just falls through to the next.
type SourceResolver = (word: string, lang: string) => Promise<RichTranslation | null>;

const resolvers: Record<TranslationSource, SourceResolver> = {
  wiktionary: resolveWiktionary,
  google: resolveTranslator,
};

export async function fetchRichTranslation(
  word: string,
  lang: string
): Promise<RichTranslation> {
  for (const source of loadSourceOrder()) {
    const result = await resolvers[source](word, lang);
    if (result) return result;
  }
  // Every source returned null (or threw) — hand back an empty fallback so the UI still renders.
  return emptyFallback(word, lang);
}

async function resolveWiktionary(word: string, lang: string): Promise<RichTranslation | null> {
  try {
    const entry = await dictionary.lookup(word, lang);
    if (!entry) return null;
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
  } catch (error) {
    console.warn('[RichTranslation] Wiktionary lookup failed, trying next source:', {
      word,
      lang,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

async function resolveTranslator(word: string, lang: string): Promise<RichTranslation | null> {
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
    console.warn('[RichTranslation] Translator failed, trying next source:', {
      word,
      lang,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

function emptyFallback(word: string, lang: string): RichTranslation {
  console.error('[RichTranslation] All sources failed:', { word, lang });
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
