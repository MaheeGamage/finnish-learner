import type { Dictionary, DictionaryEntry } from '../../ports/Dictionary';
import { fetchWordEntry } from './client';
import { parseResponse, extractLemma } from './parser';

async function lookup(word: string, lang: string): Promise<DictionaryEntry | null> {
  const response = await fetchWordEntry(word, lang);
  if (!response) return null;

  const parsed = parseResponse(response, word);
  const entry = response.entries[0];

  let result: DictionaryEntry = {
    lemma: parsed.lemma,
    grammaticalForm: parsed.grammaticalForm,
    partOfSpeech: parsed.partOfSpeech,
    definitions: parsed.definitions,
    pronunciation: parsed.pronunciation,
  };

  // If the word is an inflected form, fetch the lemma entry for its full definitions
  if (entry) {
    const lemma = extractLemma(entry);
    if (lemma && lemma !== word) {
      const lemmaResponse = await fetchWordEntry(lemma, lang);
      if (lemmaResponse && lemmaResponse.entries[0]) {
        const lemmaParsed = parseResponse(lemmaResponse, lemma);
        result = {
          lemma,
          grammaticalForm: result.grammaticalForm,
          partOfSpeech: lemmaParsed.partOfSpeech ?? result.partOfSpeech,
          definitions: lemmaParsed.definitions,
          pronunciation: lemmaParsed.pronunciation ?? result.pronunciation,
        };
      }
    }
  }

  return result;
}

export const wiktionaryDictionary: Dictionary = { lookup };
