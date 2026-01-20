// Text storage utility functions
const STORAGE_KEY = 'finnish_learning_input_text';
const VIEW_STATE_KEY = 'finnish_learning_view_state';
const AUTO_CLEAN_KEY = 'finnish_learning_auto_clean';

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

export const saveAutoCleanState = (enabled: boolean) => {
    try {
        localStorage.setItem(AUTO_CLEAN_KEY, String(enabled));
        return true;
    } catch (error) {
        console.error('Error saving auto-clean state:', error);
        return false;
    }
};

export const getStoredAutoCleanState = (): boolean => {
    try {
        const state = localStorage.getItem(AUTO_CLEAN_KEY);
        return state === null ? false : state === 'true';
    } catch (error) {
        console.error('Error retrieving auto-clean state:', error);
        return false;
    }
};