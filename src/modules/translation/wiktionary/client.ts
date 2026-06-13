/**
 * WiktApi client for fetching word entries from api.wiktapi.dev
 * Handles timeout, HTTP errors, and network failures gracefully
 */

import type { WiktApiResponse, WiktApiEntry, WiktApiSense } from './types';

const WIKTAPI_BASE_URL = 'https://api.wiktapi.dev/v1/en/word';
const WIKTAPI_TIMEOUT_MS = 5000;

/**
 * Configuration for the WiktApi client
 */
export interface WiktApiClientConfig {
  baseUrl: string;
  timeout: number;
}

const DEFAULT_CONFIG: WiktApiClientConfig = {
  baseUrl: WIKTAPI_BASE_URL,
  timeout: WIKTAPI_TIMEOUT_MS,
};

/**
 * Constructs the WiktApi URL for a word query
 * @param word - The word to look up
 * @param lang - ISO 639-1 language code (e.g., "fi")
 * @param baseUrl - The base URL for the WiktApi
 * @returns The full URL for the WiktApi request
 */
export function constructWiktApiUrl(
  word: string,
  lang: string,
  baseUrl: string = WIKTAPI_BASE_URL
): string {
  const encodedWord = encodeURIComponent(word);
  return `${baseUrl}/${encodedWord}?lang=${lang}`;
}

/**
 * Fetches word entry from WiktApi
 * @param word - The word to look up
 * @param lang - ISO 639-1 language code (e.g., "fi")
 * @param config - Optional configuration overrides
 * @returns WiktApiResponse on success, null on any failure
 */
export async function fetchWordEntry(
  word: string,
  lang: string,
  config?: Partial<WiktApiClientConfig>
): Promise<WiktApiResponse | null> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const url = constructWiktApiUrl(word, lang, mergedConfig.baseUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // HTTP error (4xx, 5xx) - log and return null
      console.warn('[WiktApi] HTTP error (falling back to generic translation):', {
        status: response.status,
        statusText: response.statusText,
        word,
        lang,
      });
      return null;
    }

    const data: WiktApiResponse = await response.json();
    return data;
  } catch (error) {
    // Handle timeout, network errors, CORS issues
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('[WiktApi] Request timeout:', { word, lang, timeout: mergedConfig.timeout });
      } else {
        console.warn('[WiktApi] Network error:', {
          word,
          lang,
          message: error.message,
        });
      }
    }
    return null;
  }
}

/**
 * Extracts definitions from WiktApi entries
 * @param entries - Array of WiktApi entries
 * @returns Array of definitions with glosses and examples
 */
function extractDefinitionsFromEntries(entries: WiktApiEntry[]): WiktApiSense[] {
  const definitions: WiktApiSense[] = [];

  for (const entry of entries) {
    if (entry.senses) {
      for (const sense of entry.senses) {
        if (sense.glosses && sense.glosses.length > 0) {
          definitions.push(sense);
        }
      }
    }
  }

  return definitions;
}

/**
 * Fetches definitions only (lighter weight operation)
 * @param word - The word to look up
 * @param lang - ISO 639-1 language code (e.g., "fi")
 * @returns Array of WiktApiSense objects with definitions, null on failure
 */
export async function fetchDefinitions(
  word: string,
  lang: string
): Promise<WiktApiSense[] | null> {
  const response = await fetchWordEntry(word, lang);

  if (!response || !response.entries) {
    return null;
  }

  return extractDefinitionsFromEntries(response.entries);
}