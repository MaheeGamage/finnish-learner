// Session-history persistence: in-progress session translations and session start time.
import type { TranslationEvent } from './types';

const SESSION_TRANSLATIONS_KEY = 'finnish_learning_session_translations';
const SESSION_START_KEY = 'finnish_learning_session_start';

export const saveSessionTranslations = (events: TranslationEvent[]) => {
    try {
        localStorage.setItem(SESSION_TRANSLATIONS_KEY, JSON.stringify(events));
        return true;
    } catch (error) {
        console.error('Error saving session translations:', error);
        return false;
    }
};

export const getSessionTranslations = (): TranslationEvent[] => {
    try {
        const rawValue = localStorage.getItem(SESSION_TRANSLATIONS_KEY);
        if (!rawValue) return [];
        return JSON.parse(rawValue) as TranslationEvent[];
    } catch (error) {
        console.error('Error retrieving session translations:', error);
        return [];
    }
};

export const clearSessionTranslations = () => {
    try {
        localStorage.removeItem(SESSION_TRANSLATIONS_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing session translations:', error);
        return false;
    }
};

export const saveSessionStart = (timestamp: number) => {
    try {
        localStorage.setItem(SESSION_START_KEY, String(timestamp));
        return true;
    } catch (error) {
        console.error('Error saving session start:', error);
        return false;
    }
};

export const getSessionStart = (): number | null => {
    try {
        const rawValue = localStorage.getItem(SESSION_START_KEY);
        if (rawValue === null) return null;
        const parsed = Number(rawValue);
        return Number.isFinite(parsed) ? parsed : null;
    } catch (error) {
        console.error('Error retrieving session start:', error);
        return null;
    }
};

export const clearSessionStart = () => {
    try {
        localStorage.removeItem(SESSION_START_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing session start:', error);
        return false;
    }
};
