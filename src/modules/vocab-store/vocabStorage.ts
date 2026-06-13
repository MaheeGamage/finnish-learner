// Vocabulary storage utility functions for tracking word lookups

const VOCAB_LOOKUP_KEY = 'finnish_learning_vocab_lookups';

export interface VocabLookup {
  word: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

/**
 * Records a word lookup for vocabulary tracking
 */
export const recordLookup = (
  word: string,
  translation: string,
  sourceLang: string,
  targetLang: string
): boolean => {
  try {
    const lookups = getLookups();
    const newLookup: VocabLookup = {
      word,
      translation,
      sourceLang,
      targetLang,
      timestamp: new Date().toISOString(),
    };
    lookups.push(newLookup);
    localStorage.setItem(VOCAB_LOOKUP_KEY, JSON.stringify(lookups));
    return true;
  } catch (error) {
    console.error('Error recording vocabulary lookup:', error);
    return false;
  }
};

/**
 * Gets all recorded vocabulary lookups
 */
export const getLookups = (): VocabLookup[] => {
  try {
    const rawValue = localStorage.getItem(VOCAB_LOOKUP_KEY);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error retrieving vocabulary lookups:', error);
    return [];
  }
};

/**
 * Clears all vocabulary lookups
 */
export const clearLookups = (): boolean => {
  try {
    localStorage.removeItem(VOCAB_LOOKUP_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing vocabulary lookups:', error);
    return false;
  }
};