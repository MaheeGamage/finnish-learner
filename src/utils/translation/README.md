# Translation System

A flexible and extensible translation system built using the Strategy Pattern. This system allows you to easily plug in different translation API providers while maintaining a consistent interface.

## Features

- ✅ **Extensible**: Easy to add new translation providers
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Backward compatible**: Existing code continues to work
- ✅ **Error handling**: Robust error handling and logging
- ✅ **Simple API**: Clean and intuitive interface

## Quick Start

### Basic Usage (Backward Compatible)

```typescript
import { translateWord } from '../utils/translator';

const translation = await translateWord('hello', 'en', 'fi');
console.log(translation); // "hei"
```

### Advanced Usage with Provider Selection

```typescript
import { TranslationServiceFactory } from '../utils/translator';

// Create a service with specific provider
const service = TranslationServiceFactory.create('mymemory');
const translation = await service.translate('hello', 'en', 'fi');

// Switch providers at runtime
const mockService = TranslationServiceFactory.create('mock');
const mockTranslation = await mockService.translate('hello', 'en', 'fi');
```

### Manual Provider Configuration

```typescript
import { TranslationService, MyMemoryProvider } from '../utils/translator';

const provider = new MyMemoryProvider();
const service = new TranslationService(provider);

const translation = await service.translate('hello', 'en', 'fi');
```

## Available Providers

- **MyMemory** (`'mymemory'`): Free translation API (original provider)
- **Mock** (`'mock'`): Mock provider for testing/development

## Adding New Providers

To add a new translation provider:

1. **Create Provider Class**:
```typescript
import { TranslationProvider } from './interfaces/TranslationProvider';

export class GoogleTranslateProvider implements TranslationProvider {
    readonly name = 'GoogleTranslate';

    async translate(word: string, from: 'en' | 'fi', to: 'en' | 'fi'): Promise<string> {
        // Implement your API call here
        try {
            // Your translation logic
            return translatedText;
        } catch (error) {
            console.error('GoogleTranslate error:', error);
            throw new Error(`Translation failed: ${error.message}`);
        }
    }
}
```

2. **Update Factory**:
```typescript
// Add to ProviderType
export type ProviderType = 'mymemory' | 'mock' | 'google';

// Add to createProvider method
if (providerType === 'google') {
    return new GoogleTranslateProvider();
}

// Update available providers list
export const AVAILABLE_PROVIDERS: ProviderType[] = ['mymemory', 'mock', 'google'];
```

3. **Export from Index**:
```typescript
export { GoogleTranslateProvider } from './providers/GoogleTranslateProvider';
```

## Architecture

The system uses the **Strategy Pattern** with these components:

- **`TranslationProvider`**: Interface that all providers must implement
- **`TranslationService`**: Main service that uses a provider strategy
- **`TranslationServiceFactory`**: Factory for easy provider creation
- **Provider Classes**: Individual implementations for each API

## Error Handling

The system provides robust error handling:

- **Provider Level**: Each provider handles its specific API errors
- **Service Level**: The main service catches and standardizes errors
- **Graceful Degradation**: Returns "Translation error" for end users while logging details

## Testing

The system is designed for easy testing:

```typescript
// Use the mock provider for tests
const testService = TranslationServiceFactory.create('mock');

// Or create a custom test provider
class TestProvider implements TranslationProvider {
    readonly name = 'Test';
    async translate() { return 'test-result'; }
}
```
