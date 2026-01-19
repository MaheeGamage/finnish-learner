export const TRANSLATION_DELAY_MS = 100; // Delay before translation starts

export const TEXT_COLORS = {
    DEFAULT: 'text-gray-800',  // Default text color for better visibility
    HIGHLIGHTED: 'text-indigo-700',
};

export const BACKGROUND_COLORS = {
    HIGHLIGHTED: 'bg-indigo-100',
};

export const TRANSLATION_MODES = {
    HOVER: 'hover',
    SELECTION: 'selection',
    BOTH: 'both',
    OFF: 'off',
} as const;

export type TranslationMode = typeof TRANSLATION_MODES[keyof typeof TRANSLATION_MODES];

// PDF Upload Configuration
export const PDF_UPLOAD_LIMITS = {
    MAX_FILE_SIZE_MB: 10, // Maximum file size in MB
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB in bytes
    MAX_TEXT_LENGTH: 100000, // Maximum extracted text length in characters
    ALLOWED_MIME_TYPES: ['application/pdf'] as const,
} as const;