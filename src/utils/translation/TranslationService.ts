import { TranslationProvider } from './interfaces/TranslationProvider';

export class TranslationService {
    private provider: TranslationProvider;

    constructor(provider: TranslationProvider) {
        this.provider = provider;
    }

    /**
     * Translates a word using the configured provider
     * @param word - The word to translate
     * @param from - Source language
     * @param to - Target language
     * @returns Promise resolving to translated text
     */
    async translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> {
        try {
            return await this.provider.translate(word, from, to);
        } catch (error) {
            console.error(`Translation service error using ${this.provider.name}:`, error);
            return 'Translation error';
        }
    }

    /**
     * Changes the translation provider
     * @param provider - New translation provider
     */
    setProvider(provider: TranslationProvider): void {
        this.provider = provider;
    }

    /**
     * Gets the current provider name
     */
    getCurrentProviderName(): string {
        return this.provider.name;
    }
}
