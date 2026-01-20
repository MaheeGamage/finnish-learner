'use client';

import { useState, useEffect, useRef } from 'react';
import TranslatableWord from '@/components/TranslatableWord';
import ContentSelector from '@/components/ContentSelector';
import SelectionTranslationPopup from '@/components/SelectionTranslationPopup';
import { TRANSLATION_MODES, TranslationMode } from '@/config/constants';
import { saveInputText, getStoredInputText, saveViewState, getStoredViewState, saveAutoCleanState, getStoredAutoCleanState } from '@/utils/textStorage';
import { cleanCopiedText } from '@/utils/textUtils';

export default function Home() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState<'en' | 'fi'>('fi');
  const [targetLang, setTargetLang] = useState<'en' | 'fi'>('en');
  const [showInput, setShowInput] = useState(true);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [translationMode, setTranslationMode] = useState<TranslationMode>(TRANSLATION_MODES.BOTH);
  const [showContentSelector, setShowContentSelector] = useState(false);
  const [autoCleanText, setAutoCleanText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load saved text and view state when component mounts
  useEffect(() => {
    const savedText = getStoredInputText();
    const savedViewState = getStoredViewState();
    const savedAutoClean = getStoredAutoCleanState();
    
    if (savedText) {
      setText(savedText);
      // Only switch to learning mode if there's text and the user was previously in learning mode
      if (savedViewState === false && savedText.trim()) {
        setShowInput(false);
      }
    }
    
    setAutoCleanText(savedAutoClean);
  }, []);

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
  
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!autoCleanText) return; // Only clean if checkbox is enabled
    
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleanedText = cleanCopiedText(pastedText);
    
    // Insert cleaned text at cursor position
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = text;
      const newText = currentText.substring(0, start) + cleanedText + currentText.substring(end);
      
      setText(newText);
      saveInputText(newText);
      
      // Set cursor position after pasted text
      setTimeout(() => {
        const newCursorPos = start + cleanedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };
  
  const handleAutoCleanToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setAutoCleanText(checked);
    saveAutoCleanState(checked);
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <input
                        type="checkbox"
                        id="autoCleanText"
                        checked={autoCleanText}
                        onChange={handleAutoCleanToggle}
                        className="w-4 h-4 text-indigo-600 bg-white border-gray-300 
                          rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                      />
                      <label 
                        htmlFor="autoCleanText" 
                        className="text-sm text-gray-700 cursor-pointer select-none"
                      >
                        Auto-clean pasted text (removes PDF formatting, page numbers, extra spaces)
                      </label>
                    </div>
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onPaste={handlePaste}
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
      <SelectionTranslationPopup
        sourceLang={sourceLang}
        targetLang={targetLang}
        translationMode={translationMode}
        isInputMode={showInput}
      />
    </main>
  );
}
