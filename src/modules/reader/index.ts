/**
 * reader — public API
 * Read content, select words/phrases, and trigger translation. Owns reader-local
 * display config and persistence (input text, view mode, scroll, last range).
 */

export { default as TranslatableWord } from './components/TranslatableWord';
export { default as TranslatableText } from './components/TranslatableText';
export { default as ContentSelector } from './components/ContentSelector';
export { default as SelectionTranslationPopup } from './components/SelectionTranslationPopup';

export {
    TRANSLATION_DELAY_MS,
    TEXT_COLORS,
    BACKGROUND_COLORS,
    TRANSLATION_MODES,
} from './config/readerConfig';
export type { TranslationMode } from './config/readerConfig';

export {
    saveInputText,
    getStoredInputText,
    saveViewState,
    getStoredViewState,
    saveReadingScrollY,
    getReadingScrollY,
    clearReadingScrollY,
    saveLastTranslatedRange,
    getLastTranslatedRange,
    clearLastTranslatedRange,
} from './storage';
export type { LastTranslatedRange } from './storage';
