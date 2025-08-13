import { TranslationProvider } from '../interfaces/TranslationProvider';

/**
 * Example provider that demonstrates how to add new translation services
 * This is a mock provider that returns simple translations for demonstration
 */
export class MockProvider implements TranslationProvider {
    readonly name = 'Mock';

    private readonly mockTranslations: Record<string, Record<string, string>> = {
        'en-fi': {
            'hello': 'hei',
            'goodbye': 'näkemiin',
            'thank you': 'kiitos',
            'yes': 'kyllä',
            'no': 'ei'
        },
        'fi-en': {
            'hei': 'hello',
            'näkemiin': 'goodbye',
            'kiitos': 'thank you',
            'kyllä': 'yes',
            'ei': 'no'
        }
    };

    async translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> {
        try {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const translationKey = `${from}-${to}`;
            const translations = this.mockTranslations[translationKey];
            
            if (!translations) {
                throw new Error(`Translation direction ${from} -> ${to} not supported`);
            }
            
            const translation = translations[word.toLowerCase()];
            if (!translation) {
                return `[Mock: No translation for '${word}']`;
            }
            
            return translation;
        } catch (error) {
            console.error(`Mock translation error:`, error);
            throw new Error(`Mock translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
