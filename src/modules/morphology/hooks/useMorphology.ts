'use client';

import { useEffect, useRef, useCallback } from 'react';
import { FinnishMorphologyAnalyzer } from '../adapters/FinnishMorphologyAnalyzer';
import type { MorphologyResult } from '../ports/MorphologyAnalyzer';

/**
 * Initialises the right morphology analyser for the given source language in the
 * background (on mount) and returns a stable `analyse` function.
 *
 * The returned function is synchronous once the analyser is ready; it returns null
 * before the WASM library has finished loading so the tooltip degrades gracefully.
 * Results are cached per word so each word is analysed at most once per session.
 */
export function useMorphology(sourceLang: 'fi' | 'en') {
  const analyzerRef = useRef<FinnishMorphologyAnalyzer | null>(null);
  const cacheRef = useRef(new Map<string, MorphologyResult | null>());
  // Use a ref rather than state so the `analyse` callback stays stable and doesn't
  // trigger re-renders of every TranslatableWord when the library finishes loading.
  const readyRef = useRef(false);

  useEffect(() => {
    if (sourceLang !== 'fi') return;

    const analyzer = new FinnishMorphologyAnalyzer();
    analyzerRef.current = analyzer;

    analyzer
      .init()
      .then(() => {
        readyRef.current = true;
      })
      .catch(() => {
        // Silently ignore — tooltip degrades to translation-only.
      });

    return () => {
      analyzer.terminate();
      analyzerRef.current = null;
      readyRef.current = false;
      cacheRef.current.clear();
    };
  }, [sourceLang]);

  const analyse = useCallback((word: string): MorphologyResult | null => {
    if (!readyRef.current || !analyzerRef.current) return null;

    // Match the same stripping the adapter applies so punctuated and clean
    // forms of the same word share one cache entry.
    const key = word.replace(/^[^a-zA-ZäöåÄÖÅ]+|[^a-zA-ZäöåÄÖÅ]+$/g, '').toLowerCase();

    // Only cache results obtained while the analyser is ready, so a word hovered
    // before init completes gets a proper retry on the next hover.
    if (cacheRef.current.has(key)) return cacheRef.current.get(key)!;

    const result = analyzerRef.current.analyse(word);
    cacheRef.current.set(key, result);
    return result;
  }, []);

  return analyse;
}
