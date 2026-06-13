import type { VocabLookup } from '../vocabStorage';

export interface VocabRepository {
  record(word: string, translation: string, sourceLang: string, targetLang: string): Promise<boolean>;
  getAll(): Promise<VocabLookup[]>;
  clear(): Promise<boolean>;
}
