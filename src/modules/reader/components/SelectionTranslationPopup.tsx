'use client';

import { useState, useEffect } from 'react';
import { SELECTION_CONFIG, TRANSLATION_CONFIG } from '../config/selectionConfig';
import { TRANSLATION_MODES, TranslationMode } from '../config/readerConfig';
import { fetchRichTranslation, RichTranslation } from '@/modules/translation';
import { recordLookup } from '@/modules/vocab-store';

interface SelectionTranslationPopupProps {
  sourceLang: 'en' | 'fi';
  targetLang: 'en' | 'fi';
  translationMode: TranslationMode;
  isInputMode: boolean;
  onTranslated: (range: { start: number; end: number }) => void;
  onSelectionTranslated?: (word: string, translation: string, type: 'selection') => void;
}

export default function SelectionTranslationPopup({
  sourceLang,
  targetLang,
  translationMode,
  isInputMode,
  onTranslated,
  onSelectionTranslated,
}: SelectionTranslationPopupProps) {
  const [selectedText, setSelectedText] = useState('');
  const [richTranslation, setRichTranslation] = useState<RichTranslation | null>(null);
  const [showSubtitlePopup, setShowSubtitlePopup] = useState(false);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Handle real-time text selection for subtitle popup
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const getElementFromNode = (node: Node | null | undefined): Element | null => {
      if (!node) return null;
      return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    };

    const getTokenIndexFromNode = (node: Node | null): number | null => {
      const element = getElementFromNode(node);
      if (!element) return null;
      const tokenElement = element.closest?.('[data-token-index]');
      if (!tokenElement) return null;
      const rawValue = tokenElement.getAttribute('data-token-index');
      if (!rawValue) return null;
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const getTokenRangeFromSelection = (range: Range | undefined | null) => {
      if (!range) return null;
      const startIndex = getTokenIndexFromNode(range.startContainer);
      const endIndex = getTokenIndexFromNode(range.endContainer);
      if (startIndex === null || endIndex === null) return null;
      return startIndex <= endIndex
        ? { start: startIndex, end: endIndex }
        : { start: endIndex, end: startIndex };
    };

    const isWithinReadingContent = (node: Node | null | undefined) => {
      const element = getElementFromNode(node);
      return !!element?.closest?.('#reading-content');
    };

    const handleSelectionChange = async () => {
      if (translationMode === TRANSLATION_MODES.OFF || isInputMode) return;
      if (translationMode !== TRANSLATION_MODES.SELECTION && translationMode !== TRANSLATION_MODES.BOTH) return;

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      // Additional safety: Check if the selection is within our main content area
      // Exclude selections that might be from the popup itself or hover tooltips
      const rangeCount = selection?.rangeCount || 0;
      if (rangeCount === 0) {
        setShowSubtitlePopup(false);
        return;
      }
      const range = selection?.getRangeAt(0);
      const container = range?.commonAncestorContainer;
      
      if (!range || !isWithinReadingContent(container)) {
        setShowSubtitlePopup(false);
        setSelectedText('');
        setRichTranslation(null);
        setIsTranslationLoading(false);
        setIsError(false);
        return;
      }
      const isWithinPopup = container && (
        (container as Element).closest?.('.fixed.bottom-6') ||
        (container.parentElement as Element)?.closest?.('.fixed.bottom-6') ||
        (container as Element).closest?.('[style*="position: fixed"]') ||
        (container.parentElement as Element)?.closest?.('[style*="position: fixed"]')
      );

      if (isWithinPopup) {
        return; // Ignore selections within the popup
      }

      // Clear previous timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      if (selectedText && selectedText.length > SELECTION_CONFIG.MIN_SELECTION_LENGTH) {
        // Check if selection is too long
        if (selectedText.length > SELECTION_CONFIG.MAX_SELECTION_LENGTH) {
          setSelectedText(selectedText);
          setShowSubtitlePopup(true);
          setIsTranslationLoading(false);
          setIsError(true);
          setRichTranslation(null);
          return;
        }

        // Show popup immediately with selected text
        setSelectedText(selectedText);
        setShowSubtitlePopup(true);
        setIsTranslationLoading(true);
        setIsError(false);
        setRichTranslation(null);
        const tokenRange = getTokenRangeFromSelection(range);

        // Debounce the translation request
        debounceTimer = setTimeout(async () => {
          try {
            const result = await fetchRichTranslation(selectedText, sourceLang);
            setRichTranslation(result);
            setIsTranslationLoading(false);
            if (result && tokenRange) {
              onTranslated(tokenRange);
              const translationText = result.fallbackTranslation || result.definitions.map(d => d.text).join(', ') || '';
              if (translationText && translationText !== TRANSLATION_CONFIG.ERRORS.TRANSLATION_ERROR) {
                onSelectionTranslated?.(selectedText, translationText, 'selection');
              }
            }
            // Record lookup for vocabulary tracking
            const translationText = result.fallbackTranslation || 
              result.definitions.map(d => d.text).join(', ') || '';
            if (translationText && translationText !== 'Translation error') {
              recordLookup(selectedText, translationText, sourceLang, targetLang);
            }
          } catch (error) {
            console.error('Error translating selection:', error);
            setIsError(true);
            setRichTranslation(null);
            setIsTranslationLoading(false);
          }
        }, SELECTION_CONFIG.DEBOUNCE_DELAY);
      } else {
        // No selection - hide popup immediately
        setShowSubtitlePopup(false);
        setSelectedText('');
        setRichTranslation(null);
        setIsTranslationLoading(false);
        setIsError(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [sourceLang, targetLang, translationMode, isInputMode, onTranslated, onSelectionTranslated]);

  if (!showSubtitlePopup) return null;

  // Helper to render rich translation content
  const renderRichContent = () => {
    if (!richTranslation) return null;
    
    const isFallback = richTranslation.source === 'fallback';
    
    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Word header with lemma and part of speech */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Show lemma if different from selected word */}
          {richTranslation.lemma && richTranslation.lemma !== selectedText ? (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-sm sm:text-base font-medium text-blue-200">
                {richTranslation.lemma}
              </span>
              {richTranslation.grammaticalForm && (
                <span className="text-xs sm:text-sm text-gray-400">
                  ({richTranslation.grammaticalForm})
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm sm:text-base font-medium text-blue-200">
              {selectedText}
            </span>
          )}
          
          {/* Part of speech badge */}
          {richTranslation.partOfSpeech && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/30 text-blue-200">
              {richTranslation.partOfSpeech}
            </span>
          )}
        </div>
        
        {/* Pronunciation */}
        {richTranslation.pronunciation && (
          <div className="text-xs sm:text-sm text-gray-300 flex items-center gap-1">
            <span>📢</span>
            <span>{richTranslation.pronunciation}</span>
          </div>
        )}
        
        {/* Definitions and examples (not for fallback) */}
        {!isFallback && richTranslation.definitions.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {richTranslation.definitions.slice(0, 3).map((def, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="text-sm sm:text-base text-white">
                  <span className="text-gray-400 mr-1">{idx + 1}.</span>
                  {def.text}
                </div>
                {/* Examples under definition */}
                {def.examples.slice(0, 2).map((ex, exIdx) => (
                  <div key={exIdx} className="ml-4 text-xs sm:text-sm text-gray-400 italic">
                    <div>&ldquo;{ex.text}&rdquo;</div>
                    {ex.translation && (
                      <div className="text-gray-500 not-italic">
                        ({ex.translation})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        
        {/* Fallback translation */}
        {isFallback && richTranslation.fallbackTranslation && (
          <div className="text-sm sm:text-base text-white">
            {richTranslation.fallbackTranslation}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in subtitle-popup px-2 sm:px-0">
      <div className="bg-black/80 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-2xl backdrop-blur-sm 
        w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[55vw] max-w-4xl mx-auto">
        {!isError ? (
          <>
            {/* Original Text Header */}
            <div className="text-xs text-gray-400 mb-1">
              {sourceLang.toUpperCase()} → {targetLang.toUpperCase()}
            </div>
            

            {/* Translation content */}
            {isTranslationLoading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                <span className="text-xs sm:text-sm text-gray-300">{TRANSLATION_CONFIG.LOADING_TEXT}</span>
              </div>
            ) : (
              renderRichContent()
            )}
          </>
        ) : (
          /* Error message */
          <div className="text-sm sm:text-base font-medium text-red-300">
            {selectedText.length > SELECTION_CONFIG.MAX_SELECTION_LENGTH 
              ? TRANSLATION_CONFIG.ERRORS.SELECTION_TOO_LONG 
              : TRANSLATION_CONFIG.ERRORS.TRANSLATION_ERROR}
          </div>
        )}
      </div>
    </div>
  );
}
