interface TranslationResponse {
    responseData: {
        translatedText: string;
    };
}

export const translateWord = async (word: string, from: 'en'|'fi', to: 'en'|'fi'): Promise<string> => {
    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`
        );
        const data: TranslationResponse = await response.json();
        return data.responseData.translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return 'Translation error';
    }
};