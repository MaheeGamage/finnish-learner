// Re-export the translateWord function from the new translation system
// This maintains backward compatibility for existing code
export { translateWord } from './translation';

// Also export the new translation system for advanced usage
export {
    TranslationService,
    TranslationServiceFactory,
    MyMemoryProvider,
    MockProvider,
    AVAILABLE_PROVIDERS
} from './translation';
export type { TranslationProvider, ProviderType } from './translation';