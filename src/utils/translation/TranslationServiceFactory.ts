import { TranslationProvider } from './interfaces/TranslationProvider';
import { MyMemoryProvider } from './providers/MyMemoryProvider';
import { MockProvider } from './providers/MockProvider';
import { TranslationService } from './TranslationService';

export type ProviderType = 'mymemory' | 'mock';

export class TranslationServiceFactory {
    /**
     * Creates a translation provider by type
     * @param providerType - The type of provider to create
     * @returns TranslationProvider instance
     */
    static createProvider(providerType: ProviderType): TranslationProvider {
        if (providerType === 'mymemory') {
            return new MyMemoryProvider();
        }
        if (providerType === 'mock') {
            return new MockProvider();
        }
        throw new Error(`Unknown provider type: ${providerType}`);
    }

    /**
     * Creates a translation service with the specified provider
     * @param providerType - The type of provider to use
     * @returns TranslationService instance
     */
    static create(providerType: ProviderType = 'mymemory'): TranslationService {
        const provider = this.createProvider(providerType);
        return new TranslationService(provider);
    }
}

// Available provider types for easy reference
export const AVAILABLE_PROVIDERS: ProviderType[] = ['mymemory', 'mock'];
