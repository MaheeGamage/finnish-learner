import type { Translator } from '../ports/Translator';
import { googleTranslateAdapter } from '../adapters/GoogleTranslateAdapter';
import { myMemoryAdapter } from '../adapters/MyMemoryAdapter';

const providers: Translator[] = [googleTranslateAdapter, myMemoryAdapter];

export async function translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> {
  for (const provider of providers) {
    try {
      return await provider.translate(word, from, to);
    } catch (error) {
      console.warn('[Translator] Provider failed, trying next:', {
        word,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  throw new Error(`All translation providers failed for "${word}"`);
}
