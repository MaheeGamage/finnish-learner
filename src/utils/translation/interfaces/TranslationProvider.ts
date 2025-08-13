export interface TranslationProvider {
  /**
   * Translates a word from one language to another
   * @param word - The word to translate
   * @param from - Source language code ('en' | 'fi')
   * @param to - Target language code ('en' | 'fi')
   * @returns Promise resolving to the translated text
   */
  translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string>;
  
  /**
   * Provider name for identification
   */
  readonly name: string;
}
