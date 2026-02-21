export const TRANSLATION_DELAY_MS = 100; // Delay before translation starts

export const TEXT_COLORS = {
    DEFAULT: 'text-gray-800',  // Default text color for better visibility
    HIGHLIGHTED: 'text-indigo-700',
};

export const BACKGROUND_COLORS = {
    HIGHLIGHTED: 'bg-indigo-100',
    LAST_TRANSLATED: 'bg-purple-100',
};

export const TRANSLATION_MODES = {
    HOVER: 'hover',
    SELECTION: 'selection',
    BOTH: 'both',
    OFF: 'off',
} as const;

export type TranslationMode = typeof TRANSLATION_MODES[keyof typeof TRANSLATION_MODES];
