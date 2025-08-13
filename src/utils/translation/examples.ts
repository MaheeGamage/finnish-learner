/**
 * Usage examples for the new translation system
 * This file demonstrates different ways to use the translation system
 */

import { 
    translateWord,
    TranslationService,
    TranslationServiceFactory,
    MyMemoryProvider,
    MockProvider,
    AVAILABLE_PROVIDERS
} from './index';

// Example 1: Basic usage (backward compatible)
export async function basicTranslation() {
    console.log('=== Basic Translation (Backward Compatible) ===');
    try {
        const result = await translateWord('hello', 'en', 'fi');
        console.log(`Translation: hello -> ${result}`);
    } catch (error) {
        console.error('Translation failed:', error);
    }
}

// Example 2: Using the factory with different providers
export async function factoryExample() {
    console.log('\n=== Factory Pattern Example ===');
    
    // List available providers
    console.log('Available providers:', AVAILABLE_PROVIDERS);
    
    // Use MyMemory provider
    const myMemoryService = TranslationServiceFactory.create('mymemory');
    console.log(`Using provider: ${myMemoryService.getCurrentProviderName()}`);
    
    try {
        const result1 = await myMemoryService.translate('thank you', 'en', 'fi');
        console.log(`MyMemory: thank you -> ${result1}`);
    } catch (error) {
        console.error('MyMemory translation failed:', error);
    }
    
    // Use Mock provider
    const mockService = TranslationServiceFactory.create('mock');
    console.log(`Using provider: ${mockService.getCurrentProviderName()}`);
    
    try {
        const result2 = await mockService.translate('hello', 'en', 'fi');
        console.log(`Mock: hello -> ${result2}`);
    } catch (error) {
        console.error('Mock translation failed:', error);
    }
}

// Example 3: Manual provider configuration
export async function manualConfiguration() {
    console.log('\n=== Manual Provider Configuration ===');
    
    // Create service with specific provider
    const provider = new MyMemoryProvider();
    const service = new TranslationService(provider);
    
    try {
        const result = await service.translate('goodbye', 'en', 'fi');
        console.log(`Manual config: goodbye -> ${result}`);
        
        // Switch provider at runtime
        service.setProvider(new MockProvider());
        console.log(`Switched to provider: ${service.getCurrentProviderName()}`);
        
        const result2 = await service.translate('goodbye', 'en', 'fi');
        console.log(`After switch: goodbye -> ${result2}`);
    } catch (error) {
        console.error('Manual configuration failed:', error);
    }
}

// Example 4: Error handling demonstration
export async function errorHandlingExample() {
    console.log('\n=== Error Handling Example ===');
    
    const mockService = TranslationServiceFactory.create('mock');
    
    try {
        // This should work
        const result1 = await mockService.translate('hello', 'en', 'fi');
        console.log(`Success: hello -> ${result1}`);
        
        // This should return a "no translation" message
        const result2 = await mockService.translate('unknown', 'en', 'fi');
        console.log(`No translation: unknown -> ${result2}`);
        
    } catch (error) {
        console.error('Error handling example failed:', error);
    }
}

// Run all examples
export async function runAllExamples() {
    await basicTranslation();
    await factoryExample();
    await manualConfiguration();
    await errorHandlingExample();
    
    console.log('\n=== All examples completed ===');
}
