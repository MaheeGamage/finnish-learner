interface TranslationResponse {
    responseData: {
        translatedText: string;
    };
}

interface GoogleTranslateResponse {
    0: Array<[string, string]>;
}

/**
 * Translate text using Google's unofficial web API
 * @param text - The text to translate
 * @param targetLang - Target language code (e.g., 'en', 'fi')
 * @param sourceLang - Source language code (default 'auto')
 * @returns Promise<string> - Translated text
 */
async function googleTranslateUnofficial(text: string, targetLang = 'en', sourceLang = 'auto'): Promise<string> {
    const baseUrl = 'https://translate.googleapis.com/translate_a/single';
    const params = new URLSearchParams({
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text
    });

    const url = `${baseUrl}?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const data = await res.json() as GoogleTranslateResponse;
    return data[0].map((item: [string, string]) => item[0]).join('');
}

/**
 * Translate text using MyMemory API (backup function)
 * @param word - The word to translate
 * @param from - Source language code
 * @param to - Target language code
 * @returns Promise<string> - Translated text
 */
export const translateWordMyMemory = async (word: string, from: 'en'|'fi', to: 'en'|'fi'): Promise<string> => {
    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`
        );
        const data: TranslationResponse = await response.json();
        return data.responseData.translatedText;
    } catch (error) {
        console.error('MyMemory translation error:', error);
        return 'Translation error';
    }
};

export const translateWord = async (word: string, from: 'en'|'fi', to: 'en'|'fi'): Promise<string> => {
    try {
        // Use Google Translate as primary translation service
        const result = await googleTranslateUnofficial(word, to, from);
        return result;
    } catch (error) {
        console.error('Google translation error:', error);
        
        // Fallback to MyMemory if Google Translate fails
        try {
            console.log('Falling back to MyMemory translation...');
            return await translateWordMyMemory(word, from, to);
        } catch (fallbackError) {
            console.error('All translation services failed:', fallbackError);
            return 'Translation error';
        }
    }
};