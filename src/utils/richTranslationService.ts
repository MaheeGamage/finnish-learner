/**
 * Rich Translation Service
 * Orchestrates fetching rich linguistic data from WiktApi with fallback to existing translator
 */

import { RichTranslation } from '../types/richTranslation';
import { WiktApiResponse } from '../types/wiktApi';
import { fetchWordEntry } from './wiktApiClient';
import { parseResponse, extractLemma } from './wiktApiParser';
import { translateWord } from './translator';

/**
 * Main entry point for rich translation
 * Tries WiktApi first, falls back to existing translator on any error
 * @param word - The word to translate
 * @param lang - ISO 639-1 language code (e.g., "fi")
 * @returns RichTranslation object with all available data
 */
export async function fetchRichTranslation(
  word: string,
  lang: string
): Promise<RichTranslation> {
  try {
    // Try fetching from WiktApi first
    const response = await fetchWiktApiEntry(word, lang);
    
    if (response) {
      const translation = parseResponse(response, word);
      translation.language = lang;
      
      // Check if the word is an inflected form - if so, fetch the lemma entry too
      const entry = response.entries[0];
      if (entry) {
        const lemma = extractLemma(entry);
        if (lemma && lemma !== word) {
          // Fetch the lemma entry to get full definitions
          const lemmaResponse = await fetchWiktApiEntry(lemma, lang);
          if (lemmaResponse && lemmaResponse.entries[0]) {
            // Parse lemma entry for definitions, but keep original word's grammatical form
            const lemmaTranslation = parseResponse(lemmaResponse, lemma);
            lemmaTranslation.language = lang;
            
            // Merge: use original word's grammatical form, but lemma's definitions and pronunciation
            translation.lemma = lemma;
            translation.definitions = lemmaTranslation.definitions;
            if (lemmaTranslation.pronunciation && !translation.pronunciation) {
              translation.pronunciation = lemmaTranslation.pronunciation;
            }
            if (lemmaTranslation.partOfSpeech && !translation.partOfSpeech) {
              translation.partOfSpeech = lemmaTranslation.partOfSpeech;
            }
          }
        }
      }
      
      return translation;
    }
    
    // WiktApi returned no data - use fallback
    return await createFallbackTranslation(word, lang);
  } catch (error) {
    // Log error and fall back
    console.error('[RichTranslation] Error fetching from WiktApi:', {
      word,
      lang,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return await createFallbackTranslation(word, lang);
  }
}

/**
 * Fetches entry data from WiktApi
 * @param word - The word to look up
 * @param lang - ISO 639-1 language code
 * @returns WiktApiResponse on success, null on failure
 */
async function fetchWiktApiEntry(
  word: string,
  lang: string
): Promise<WiktApiResponse | null> {
  const response = await fetchWordEntry(word, lang);
  return response;
}

/**
 * Creates fallback translation using existing translator service
 * @param word - Word to translate
 * @param lang - Source language code
 * @returns RichTranslation with basic translation only
 */
export async function createFallbackTranslation(
  word: string,
  lang: string
): Promise<RichTranslation> {
  try {
    // Use existing translator service (translates from source lang to English)
    const translation = await translateWord(word, lang as 'en' | 'fi', 'en');
    
    return {
      word,
      language: lang,
      lemma: null,
      grammaticalForm: null,
      partOfSpeech: null,
      definitions: [],
      pronunciation: null,
      fallbackTranslation: translation,
      source: 'fallback',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Even fallback failed - return minimal translation
    console.error('[RichTranslation] Fallback translation failed:', {
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