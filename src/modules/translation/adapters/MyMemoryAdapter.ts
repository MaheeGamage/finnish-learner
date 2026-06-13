import type { Translator } from '../ports/Translator';

interface MyMemoryResponse {
  responseData: { translatedText: string };
}

async function translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> {
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${from}|${to}`
  );
  const data: MyMemoryResponse = await res.json();
  return data.responseData.translatedText;
}

export const myMemoryAdapter: Translator = { translate };
