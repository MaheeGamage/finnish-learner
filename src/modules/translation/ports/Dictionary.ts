import type { Definition, PartOfSpeech } from '../types';

export interface DictionaryEntry {
  lemma: string | null;
  grammaticalForm: string | null;
  partOfSpeech: PartOfSpeech | null;
  definitions: Definition[];
  pronunciation: string | null;
}

export interface Dictionary {
  lookup(word: string, lang: string): Promise<DictionaryEntry | null>;
}
