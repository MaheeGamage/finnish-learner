import { TranslationProvider } from '../interfaces/TranslationProvider';

interface MyMemoryResponse {
    responseData: {
        translatedText: string;
    };
}

export class MyMemoryProvider implements TranslationProvider {
    readonly name = 'MyMemory';

    async translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> {
        try {
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: MyMemoryResponse = await response.json();
            return data.responseData.translatedText;
        } catch (error) {
            console.error(`MyMemory translation error:`, error);
            throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
