/**
 * Configuration constants for text selection and translation features
 */

export const SELECTION_CONFIG = {
  // Debounce delay for translation requests (in milliseconds)
  DEBOUNCE_DELAY: 300,
  
  // Minimum character length to trigger translation
  MIN_SELECTION_LENGTH: 3,
  
  // Maximum character length for selection (to prevent very long selections)
  MAX_SELECTION_LENGTH: 1000,
  
  // Animation duration for popups (in milliseconds)
  POPUP_ANIMATION_DURATION: 200,
  
  // Z-index for popups to ensure they appear above other content
  POPUP_Z_INDEX: 50,
} as const;

export const POPUP_CONFIG = {
  // Bottom margin from viewport edge
  BOTTOM_MARGIN: {
    MOBILE: '1rem',    // 16px
    DESKTOP: '1.5rem', // 24px
  },
  
  // Width configurations for different screen sizes
  WIDTH: {
    MOBILE: '95vw',
    TABLET: '85vw',
    DESKTOP_SM: '75vw',
    DESKTOP_MD: '65vw',
    DESKTOP_LG: '55vw',
    MAX_WIDTH: '64rem', // 1024px
  },
  
  // Animation classes
  ANIMATIONS: {
    FADE_IN: 'animate-fade-in',
    SLIDE_UP: 'animate-slide-up',
  },
  
  // CSS classes for popup styling
  STYLES: {
    POPUP_CONTAINER: 'fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in subtitle-popup px-2 sm:px-0',
    POPUP_CONTENT: 'bg-black/80 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-2xl backdrop-blur-sm w-[95vw] sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[55vw] max-w-4xl mx-auto',
  },
} as const;

export const TRANSLATION_CONFIG = {
  // Error messages
  ERRORS: {
    TRANSLATION_ERROR: 'Translation error',
    NETWORK_ERROR: 'Network error - please try again',
    SERVICE_UNAVAILABLE: 'Translation service unavailable',
    SELECTION_TOO_LONG: 'Selected text is too long to translate',
  },
  
  // Loading states
  LOADING_TEXT: 'Translating...',
  
  // API timeouts (in milliseconds)
  TIMEOUT: 10000, // 10 seconds
  
  // Retry configuration
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second
} as const;
