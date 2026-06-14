import type { Translator } from '../ports/Translator';

interface GoogleTranslateResponse {
  0: Array<[string, string]>;
}

async function translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> {
  const params = new URLSearchParams({ client: 'gtx', sl: from, tl: to, dt: 't', q: word });
  const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
  if (!res.ok) throw new Error(`Google Translate HTTP error: ${res.status}`);
  const data = await res.json() as GoogleTranslateResponse;
  return data[0].map((item: [string, string]) => item[0]).join('');
}

export const googleTranslateAdapter: Translator = { translate };
