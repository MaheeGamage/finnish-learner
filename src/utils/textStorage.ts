// Text storage utility functions
const STORAGE_KEY = 'finnish_learning_input_text';
const VIEW_STATE_KEY = 'finnish_learning_view_state';
const READING_SCROLL_Y_KEY = 'finnish_learning_scroll_y';
const LAST_TRANSLATED_RANGE_KEY = 'finnish_learning_last_translated_range';

export type LastTranslatedRange = {
    start: number;
    end: number;
};

export const saveInputText = (text: string) => {
    try {
        // Store text exactly as is, without any trimming or formatting changes
        localStorage.setItem(STORAGE_KEY, text);
        return true;
    } catch (error) {
        console.error('Error saving input text:', error);
        return false;
    }
};

export const getStoredInputText = (): string | null => {
    try {
        // Return the exact text as stored, preserving all whitespace
        return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error retrieving input text:', error);
        return null;
    }
};

export const saveViewState = (isInputMode: boolean) => {
    try {
        localStorage.setItem(VIEW_STATE_KEY, String(isInputMode));
        return true;
    } catch (error) {
        console.error('Error saving view state:', error);
        return false;
    }
};

export const getStoredViewState = (): boolean | null => {
    try {
        const state = localStorage.getItem(VIEW_STATE_KEY);
        return state === null ? null : state === 'true';
    } catch (error) {
        console.error('Error retrieving view state:', error);
        return null;
    }
};

export const saveReadingScrollY = (scrollY: number) => {
    try {
        localStorage.setItem(READING_SCROLL_Y_KEY, String(scrollY));
        return true;
    } catch (error) {
        console.error('Error saving reading scroll position:', error);
        return false;
    }
};

export const getReadingScrollY = (): number | null => {
    try {
        const rawValue = localStorage.getItem(READING_SCROLL_Y_KEY);
        if (rawValue === null) return null;
        const parsed = Number(rawValue);
        return Number.isFinite(parsed) ? parsed : null;
    } catch (error) {
        console.error('Error retrieving reading scroll position:', error);
        return null;
    }
};

export const clearReadingScrollY = () => {
    try {
        localStorage.removeItem(READING_SCROLL_Y_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing reading scroll position:', error);
        return false;
    }
};

export const saveLastTranslatedRange = (range: LastTranslatedRange) => {
    try {
        localStorage.setItem(LAST_TRANSLATED_RANGE_KEY, JSON.stringify(range));
        return true;
    } catch (error) {
        console.error('Error saving last translated range:', error);
        return false;
    }
};

export const getLastTranslatedRange = (): LastTranslatedRange | null => {
    try {
        const rawValue = localStorage.getItem(LAST_TRANSLATED_RANGE_KEY);
        if (!rawValue) return null;
        const parsed = JSON.parse(rawValue) as LastTranslatedRange;
        if (typeof parsed?.start !== 'number' || typeof parsed?.end !== 'number') {
            return null;
        }
        return parsed;
    } catch (error) {
        console.error('Error retrieving last translated range:', error);
        return null;
    }
};

export const clearLastTranslatedRange = () => {
    try {
        localStorage.removeItem(LAST_TRANSLATED_RANGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing last translated range:', error);
        return false;
    }
};
