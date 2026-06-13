export interface Translator {
  translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string>;
}
