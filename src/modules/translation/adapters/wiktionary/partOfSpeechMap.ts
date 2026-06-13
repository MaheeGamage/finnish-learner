import { PartOfSpeech } from '../../types';

/**
 * Maps WiktApi POS codes to human-readable labels
 */
export const POS_MAPPING: Record<string, PartOfSpeech> = {
  'n': 'noun',
  'noun': 'noun',
  'v': 'verb',
  'verb': 'verb',
  'adj': 'adjective',
  'adjective': 'adjective',
  'adv': 'adverb',
  'adverb': 'adverb',
  'pron': 'pronoun',
  'pronoun': 'pronoun',
  'prep': 'preposition',
  'preposition': 'preposition',
  'conj': 'conjunction',
  'conjunction': 'conjunction',
  'intj': 'interjection',
  'interjection': 'interjection',
  'num': 'numeral',
  'numeral': 'numeral',
  'particle': 'particle',
};

/**
 * Maps a WiktApi part of speech code to a PartOfSpeech label
 * @param posCode - The POS code from WiktApi (e.g., 'n', 'noun', 'v', 'verb')
 * @returns The corresponding PartOfSpeech label, or null if unknown
 */
export function mapPartOfSpeech(posCode: string): PartOfSpeech | null {
  return POS_MAPPING[posCode] ?? null;
}