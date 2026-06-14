import type { VocabRepository } from '../ports/VocabRepository';
import { recordLookup, getLookups, clearLookups } from '../vocabStorage';

export const localStorageVocabRepository: VocabRepository = {
  record: (word, translation, sourceLang, targetLang) =>
    Promise.resolve(recordLookup(word, translation, sourceLang, targetLang)),
  getAll: () => Promise.resolve(getLookups()),
  clear: () => Promise.resolve(clearLookups()),
};
