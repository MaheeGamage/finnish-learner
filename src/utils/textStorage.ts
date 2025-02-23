// Text storage utility functions
const STORAGE_KEY = 'finnish_learning_input_text';
const VIEW_STATE_KEY = 'finnish_learning_view_state';

export const saveInputText = (text: string) => {
    try {
        localStorage.setItem(STORAGE_KEY, text);
        return true;
    } catch (error) {
        console.error('Error saving input text:', error);
        return false;
    }
};

export const getStoredInputText = (): string | null => {
    try {
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