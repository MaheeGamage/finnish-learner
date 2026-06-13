import { WiktApiResponse, WiktApiEntry, WiktApiSense } from './types';
import { RichTranslation, Definition, Example, PartOfSpeech } from '../types';
import { mapPartOfSpeech } from './partOfSpeechMap';
import { formatGrammaticalTags } from './grammaticalTags';

/**
 * Extracts the lemma (base word) from a WiktApi entry
 * @param entry - The WiktApi entry to extract from
 * @returns The lemma word if the entry is an inflected form, null otherwise
 */
export function extractLemma(entry: WiktApiEntry): string | null {
  // Check all senses for form_of field
  for (const sense of entry.senses) {
    if (sense.form_of && sense.form_of.length > 0) {
      return sense.form_of[0].word;
    }
  }
  return null;
}

/**
 * Extracts the part of speech from a WiktApi entry
 * @param entry - The WiktApi entry to extract from
 * @returns The PartOfSpeech if valid, null otherwise
 */
export function extractPartOfSpeech(entry: WiktApiEntry): PartOfSpeech | null {
  if (!entry.pos) {
    return null;
  }
  return mapPartOfSpeech(entry.pos);
}

/**
 * Extracts definitions with examples from a WiktApi entry
 * Returns up to 3 definitions, each with up to 2 examples
 * @param entry - The WiktApi entry to extract from
 * @returns Array of Definition objects
 */
export function extractDefinitions(entry: WiktApiEntry): Definition[] {
  const definitions: Definition[] = [];
  
  for (const sense of entry.senses) {
    // Stop after 3 definitions
    if (definitions.length >= 3) {
      break;
    }
    
    // Skip senses without glosses
    if (!sense.glosses || sense.glosses.length === 0) {
      continue;
    }
    
    // Use the first gloss as the definition text
    const definitionText = sense.glosses[0];
    
    // Extract up to 2 examples
    const examples: Example[] = [];
    if (sense.examples) {
      for (let i = 0; i < Math.min(2, sense.examples.length); i++) {
        const example = sense.examples[i];
        examples.push({
          text: example.text,
          translation: example.translation ?? null,
        });
      }
    }
    
    definitions.push({
      text: definitionText,
      examples,
    });
  }
  
  return definitions;
}

/**
 * Extracts IPA pronunciation from a WiktApi entry
 * Returns the first IPA found, enclosed in square brackets
 * @param entry - The WiktApi entry to extract from
 * @returns The IPA pronunciation string, or null if unavailable
 */
export function extractPronunciation(entry: WiktApiEntry): string | null {
  if (!entry.sounds || entry.sounds.length === 0) {
    return null;
  }
  
  // Find the first sound with an IPA
  for (const sound of entry.sounds) {
    if (sound.ipa) {
      // Enclose in square brackets if not already
      const ipa = sound.ipa;
      if (ipa.startsWith('[') && ipa.endsWith(']')) {
        return ipa;
      }
      return `[${ipa}]`;
    }
  }
  
  return null;
}

/**
 * Extracts grammatical form description from a WiktApi sense
 * @param sense - The WiktApi sense to extract from
 * @returns Formatted grammatical form string, or empty string
 */
function extractGrammaticalForm(sense: WiktApiSense): string {
  if (!sense.tags || sense.tags.length === 0) {
    return '';
  }
  return formatGrammaticalTags(sense.tags);
}

/**
 * Parses a WiktApi response into a RichTranslation object
 * @param response - The raw WiktApi response
 * @param originalWord - The originally selected word
 * @returns A RichTranslation object with all available data
 */
export function parseResponse(response: WiktApiResponse, originalWord: string): RichTranslation {
  // Get the first entry (most relevant)
  const entry = response.entries[0];
  
  // Handle empty entries array
  if (!entry) {
    return {
      word: originalWord,
      language: '', // Will be set by caller
      lemma: null,
      grammaticalForm: null,
      partOfSpeech: null,
      definitions: [],
      pronunciation: null,
      fallbackTranslation: null,
      source: 'wiktapi',
      fetchedAt: new Date().toISOString(),
    };
  }
  
  // Extract all fields
  const lemma = extractLemma(entry);
  const partOfSpeech = extractPartOfSpeech(entry);
  const definitions = extractDefinitions(entry);
  const pronunciation = extractPronunciation(entry);
  
  // Extract grammatical form from the first sense that has tags
  let grammaticalForm: string | null = null;
  for (const sense of entry.senses) {
    const form = extractGrammaticalForm(sense);
    if (form) {
      grammaticalForm = form;
      break;
    }
  }
  
  return {
    word: originalWord,
    language: '', // Will be set by caller
    lemma,
    grammaticalForm,
    partOfSpeech,
    definitions,
    pronunciation,
    fallbackTranslation: null,
    source: 'wiktapi',
    fetchedAt: new Date().toISOString(),
  };
}