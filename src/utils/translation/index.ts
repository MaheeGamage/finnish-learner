// Public API exports
export { TranslationService } from './TranslationService';
export { TranslationServiceFactory, AVAILABLE_PROVIDERS } from './TranslationServiceFactory';
export type { ProviderType } from './TranslationServiceFactory';
export type { TranslationProvider } from './interfaces/TranslationProvider';

// Provider exports for advanced usage
export { MyMemoryProvider } from './providers/MyMemoryProvider';
export { MockProvider } from './providers/MockProvider';

// Default translation service instance for backward compatibility
import { TranslationServiceFactory } from './TranslationServiceFactory';

const defaultTranslationService = TranslationServiceFactory.create('mymemory');

/**
 * Backward compatible function that maintains the same API as the original translateWord
 * @param word - The word to translate
 * @param from - Source language
 * @param to - Target language
 * @returns Promise resolving to translated text
 */
export const translateWord = async (word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> => {
    return defaultTranslationService.translate(word, from, to);
};
