'use client';

import { useState, useEffect } from 'react';
import { SELECTION_CONFIG, TRANSLATION_CONFIG } from '@/config/selectionConfig';
import { TRANSLATION_MODES, TranslationMode } from '@/config/constants';
import { translateWord } from '@/utils/translator';

interface SelectionTranslationPopupProps {
  sourceLang: 'en' | 'fi';
  targetLang: 'en' | 'fi';
  translationMode: TranslationMode;
  isInputMode: boolean;
  onTranslated: (range: { start: number; end: number }) => void;
}

export default function SelectionTranslationPopup({
  sourceLang,
  targetLang,
  translationMode,
  isInputMode,
  onTranslated,
}: SelectionTranslationPopupProps) {
  const [selectedText, setSelectedText] = useState('');
  const [selectedTranslation, setSelectedTranslation] = useState('');
  const [showSubtitlePopup, setShowSubtitlePopup] = useState(false);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Handle real-time text selection for subtitle popup
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const getElementFromNode = (node: Node | null): Element | null => {
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

    const isWithinReadingContent = (node: Node | null) => {
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
      const range = selection?.getRangeAt(0);
      const container = range?.commonAncestorContainer;
      if (!range || !isWithinReadingContent(container)) {
        setShowSubtitlePopup(false);
        setSelectedText('');
        setSelectedTranslation('');
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
          setSelectedText('');
          setShowSubtitlePopup(true);
          setIsTranslationLoading(false);
          setIsError(true);
          setSelectedTranslation(TRANSLATION_CONFIG.ERRORS.SELECTION_TOO_LONG);
          return;
        }

        // Show popup immediately with selected text
        setSelectedText(selectedText);
        setShowSubtitlePopup(true);
        setIsTranslationLoading(true);
        setIsError(false);
        setSelectedTranslation('');
        const tokenRange = getTokenRangeFromSelection(range);

        // Debounce the translation request
        debounceTimer = setTimeout(async () => {
          try {
            const result = await translateWord(selectedText, sourceLang, targetLang);
            setSelectedTranslation(result);
            setIsTranslationLoading(false);
            if (result && tokenRange) {
              onTranslated(tokenRange);
            }
          } catch (error) {
            console.error('Error translating selection:', error);
            setIsError(true);
            setSelectedTranslation(TRANSLATION_CONFIG.ERRORS.TRANSLATION_ERROR);
            setIsTranslationLoading(false);
          }
        }, SELECTION_CONFIG.DEBOUNCE_DELAY);
      } else {
        // No selection - hide popup immediately
        setShowSubtitlePopup(false);
        setSelectedText('');
        setSelectedTranslation('');
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
  }, [sourceLang, targetLang, translationMode, isInputMode, onTranslated]);

  if (!showSubtitlePopup) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in subtitle-popup px-2 sm:px-0">
      <div className="bg-black/80 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-2xl backdrop-blur-sm 
        w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[55vw] max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {!isError ? (
            <>
              {/* Original Text */}
              <div className="flex-1 text-center sm:text-left min-w-0 w-full sm:w-auto">
                <div className="text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  {sourceLang.toUpperCase()}
                </div>
                <div className="text-sm sm:text-base font-medium break-words">
                  &ldquo;{selectedText}&rdquo;
                </div>
              </div>
              
              {/* Arrow/Divider */}
              <div className="hidden sm:block text-gray-400 mx-2 flex-shrink-0">→</div>
              <div className="sm:hidden w-full border-t border-gray-600 my-1"></div>
              
              {/* Translation */}
              <div className="flex-1 text-center sm:text-right min-w-0 w-full sm:w-auto">
                <div className="text-xs sm:text-sm font-medium text-gray-300 mb-1">
                  {targetLang.toUpperCase()}
                </div>
                {isTranslationLoading ? (
                  <div className="flex items-center justify-center sm:justify-end space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                    <span className="text-xs sm:text-sm text-gray-300">{TRANSLATION_CONFIG.LOADING_TEXT}</span>
                  </div>
                ) : (
                  <div className="text-sm sm:text-base font-medium text-blue-200 break-words">
                    &ldquo;{selectedTranslation}&rdquo;
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Error message only */
            <div className="flex-1 text-center w-full">
              <div className="text-sm sm:text-base font-medium text-red-300 break-words">
                {selectedTranslation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
