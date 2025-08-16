'use client';

import { useState, useEffect } from 'react';
import TranslatableWord from '@/components/TranslatableWord';
import ContentSelector from '@/components/ContentSelector';
import { TRANSLATION_MODES, TranslationMode } from '@/config/constants';
import { SELECTION_CONFIG, TRANSLATION_CONFIG } from '@/config/selectionConfig';
import { saveInputText, getStoredInputText, saveViewState, getStoredViewState } from '@/utils/textStorage';
import { translateWord } from '@/utils/translator';

export default function Home() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState<'en' | 'fi'>('fi');
  const [targetLang, setTargetLang] = useState<'en' | 'fi'>('en');
  const [showInput, setShowInput] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [translationMode, setTranslationMode] = useState<TranslationMode>(TRANSLATION_MODES.BOTH);
  const [showContentSelector, setShowContentSelector] = useState(false);
  
  // Bottom panel state for selection translations
  const [selectedText, setSelectedText] = useState('');
  const [selectedTranslation, setSelectedTranslation] = useState('');
  const [showSubtitlePopup, setShowSubtitlePopup] = useState(false);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);

  // Load saved text and view state when component mounts
  useEffect(() => {
    const savedText = getStoredInputText();
    const savedViewState = getStoredViewState();
    
    if (savedText) {
      setText(savedText);
      // Only switch to learning mode if there's text and the user was previously in learning mode
      if (savedViewState === false && savedText.trim()) {
        setShowInput(false);
      }
    }
  }, []);

  // Handle real-time text selection for subtitle popup
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    
    const handleSelectionChange = async () => {
      if (translationMode === TRANSLATION_MODES.OFF || showInput) return;
      if (translationMode !== TRANSLATION_MODES.SELECTION && translationMode !== TRANSLATION_MODES.BOTH) return;

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      // Additional safety: Check if the selection is within our main content area
      // Exclude selections that might be from the popup itself or hover tooltips
      const range = selection?.getRangeAt(0);
      const container = range?.commonAncestorContainer;
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
          setSelectedTranslation(TRANSLATION_CONFIG.ERRORS.SELECTION_TOO_LONG);
          return;
        }

        // Show popup immediately with selected text
        setSelectedText(selectedText);
        setShowSubtitlePopup(true);
        setIsTranslationLoading(true);
        setSelectedTranslation('');

        // Debounce the translation request
        debounceTimer = setTimeout(async () => {
          try {
            const result = await translateWord(selectedText, sourceLang, targetLang);
            setSelectedTranslation(result);
            setIsTranslationLoading(false);
          } catch (error) {
            console.error('Error translating selection:', error);
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
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [sourceLang, targetLang, translationMode, showInput]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setText('');
    setShowInput(true);
    saveViewState(true);
  };

  const handleSubmit = () => {
    if (text) {  // Remove trim() to preserve whitespace
      setShowInput(false);
      saveInputText(text);  // Save text as is
      saveViewState(false);
    }
  };

  const handleClear = () => {
    setText('');
    setShowInput(true);
    setActiveWordIndex(null);
    saveInputText('');
    saveViewState(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);  // Store text exactly as typed
    saveInputText(newText);
  };
  
  const handleContentSelect = (content: string) => {
    setText(content);
    saveInputText(content);
    setShowContentSelector(false);
  };

  // Split text preserving newlines and multiple spaces
  const words = text
    .split(/(\s+)/g)  // Split on whitespace but keep the separators
    .map((part, index) => ({
      content: part,
      isWhitespace: /^\s+$/.test(part),
      key: index
    }));

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full min-h-screen mx-auto md:max-w-4xl p-4 sm:p-6 md:p-8">
        <div className="space-y-4 md:space-y-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">
            Finnish Learning Assistant
          </h1>
          
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Language Controls */}
            <div className="grid grid-cols-3 sm:flex items-center justify-center gap-2 sm:gap-4">
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value as 'en' | 'fi')}
                className="px-2 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-gray-200 
                  bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="fi">Finnish</option>
                <option value="en">English</option>
              </select>
              
              <button
                onClick={handleSwapLanguages}
                className="px-2 sm:px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 
                  hover:bg-indigo-200 transition-colors text-sm sm:text-base"
              >
                ↔️ Swap
              </button>
              
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as 'en' | 'fi')}
                className="px-2 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-gray-200 
                  bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="en">English</option>
                <option value="fi">Finnish</option>
              </select>
            </div>

            {/* Translation Mode */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-center">
              <label className="text-sm sm:text-base text-gray-700">Translation Mode:</label>
              <select
                value={translationMode}
                onChange={(e) => setTranslationMode(e.target.value as TranslationMode)}
                className="w-full sm:w-auto px-2 sm:px-4 py-2 text-sm sm:text-base rounded-lg 
                  border border-gray-200 bg-white text-gray-700 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={TRANSLATION_MODES.BOTH}>Hover & Selection</option>
                <option value={TRANSLATION_MODES.HOVER}>Hover Only</option>
                <option value={TRANSLATION_MODES.SELECTION}>Selection Only</option>
                <option value={TRANSLATION_MODES.OFF}>Off</option>
              </select>
            </div>
          </div>

          {showInput ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Content Selection */}
              {showContentSelector ? (
                <div className="mt-2">
                  <ContentSelector
                    onContentSelect={handleContentSelect}
                  />
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => setShowContentSelector(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={handleTextChange}
                      placeholder="Enter text to translate..."
                      className="w-full min-h-[150px] sm:min-h-[200px] p-4 sm:p-6 rounded-xl 
                        border-2 border-indigo-200 bg-white
                        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 
                        text-gray-900 placeholder-gray-500
                        text-base sm:text-lg leading-relaxed shadow-inner
                        transition-all duration-200"
                      style={{ resize: 'none' }}
                    />
                    <div className="absolute bottom-2 right-2 text-xs sm:text-sm text-gray-600">
                      {text.length} characters
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                      onClick={() => setShowContentSelector(true)}
                      className="px-6 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg 
                        hover:bg-indigo-200 transition-colors shadow-sm 
                        hover:shadow-md text-base sm:text-lg font-medium"
                    >
                      Select Content
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 
                        text-white rounded-lg hover:bg-indigo-700 
                        transition-all duration-200 shadow-md 
                        hover:shadow-lg disabled:opacity-50
                        disabled:cursor-not-allowed text-base sm:text-lg font-medium"
                      disabled={!text.trim()}
                    >
                      Start Learning
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="p-4 sm:p-8 bg-gray-50 rounded-xl shadow-sm 
                border-2 border-gray-100 leading-relaxed 
                text-base sm:text-lg min-h-[150px] sm:min-h-[200px] whitespace-pre-wrap">
                {words.map(({ content, isWhitespace, key }) => 
                  isWhitespace ? (
                    <span key={key}>{content}</span>
                  ) : (
                    <TranslatableWord
                      key={key}
                      word={content}
                      sourceLang={sourceLang}
                      targetLang={targetLang}
                      onHover={() => setActiveWordIndex(key)}
                      isActive={activeWordIndex === key}
                      translationMode={translationMode}
                    />
                  )
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setShowInput(true);
                    setShowContentSelector(true);
                  }}
                  className="px-6 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg 
                    hover:bg-indigo-200 transition-colors shadow-sm 
                    hover:shadow-md text-base sm:text-lg font-medium"
                >
                  Change Content
                </button>
                <button
                  onClick={handleClear}
                  className="px-6 py-2.5 bg-gray-200 
                    text-gray-700 rounded-lg hover:bg-gray-300 
                    transition-colors shadow-sm hover:shadow-md 
                    text-base sm:text-lg font-medium"
                >
                  Clear Text
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtitle-Style Translation Popup */}
      {showSubtitlePopup && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in subtitle-popup px-2 sm:px-0">
          <div className="bg-black/80 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-2xl backdrop-blur-sm 
            w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[55vw] max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
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
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
