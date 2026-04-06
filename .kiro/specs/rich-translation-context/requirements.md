# Requirements Document: Rich Translation Context

## Introduction

This document specifies requirements for enhancing the translation feature in a Finnish language learning app. The current system provides only direct word translations via Google Translate's unofficial API. The enhanced system will provide rich linguistic context including base word forms (lemmas), parts of speech, definitions, example sentences, and pronunciation using the WiktApi service.

## Glossary

- **Rich_Translation_Service**: The new translation service that provides comprehensive linguistic data from WiktApi
- **Fallback_Translation_Service**: The existing Google Translate-based service used when WiktApi data is unavailable
- **Lemma**: The dictionary form (base form) of an inflected word (e.g., "koira" is the lemma of "koirassa")
- **Inflected_Form**: A word form that has been modified from its base form according to Finnish grammar rules
- **WiktApi**: The free, open API service providing structured linguistic data from Wiktionary
- **IPA**: International Phonetic Alphabet notation for representing pronunciation
- **Part_of_Speech**: Grammatical category of a word (noun, verb, adjective, etc.)
- **Gloss**: A definition or explanation of a word's meaning
- **Form_Of**: A WiktApi field indicating that a word is an inflected form of another word

## Requirements

### Requirement 1: Fetch Rich Translation Data

**User Story:** As a Finnish language learner, I want to see detailed information about words I select, so that I can understand the word's form, meaning, and usage in context.

#### Acceptance Criteria

1. WHEN a user selects a word in the reading content, THE Rich_Translation_Service SHALL fetch linguistic data from WiktApi within 3 seconds
2. WHEN WiktApi returns a successful response, THE Rich_Translation_Service SHALL extract and structure the following data: lemma, part of speech, definitions, example sentences, and IPA pronunciation
3. WHEN the selected word is an inflected form, THE Rich_Translation_Service SHALL detect the `form_of` field and fetch the base word's full entry
4. WHEN WiktApi returns an error or no data, THE Rich_Translation_Service SHALL fall back to the Fallback_Translation_Service within 2 seconds
5. THE Rich_Translation_Service SHALL construct the WiktApi URL using the format `https://api.wiktapi.dev/v1/en/word/{word}?lang=fi`

### Requirement 2: Display Base Word (Lemma)

**User Story:** As a Finnish language learner, I want to see the dictionary form of inflected words, so that I can look up the word in a dictionary and understand its core meaning.

#### Acceptance Criteria

1. WHEN the selected word is an inflected form, THE Rich_Translation_Service SHALL display the lemma (base word) prominently in the translation popup
2. WHEN the selected word matches its lemma, THE Rich_Translation_Service SHALL display the word without a separate lemma indicator
3. WHEN displaying a lemma, THE Rich_Translation_Service SHALL show the grammatical relationship (e.g., "koirassa → koira (inessive)")

### Requirement 3: Display Part of Speech

**User Story:** As a Finnish language learner, I want to know the grammatical category of each word, so that I can understand how to use it correctly in sentences.

#### Acceptance Criteria

1. WHEN WiktApi returns a `pos` field, THE Rich_Translation_Service SHALL display the part of speech in the translation popup
2. THE Rich_Translation_Service SHALL map WiktApi part of speech codes to human-readable labels (e.g., "noun", "verb", "adjective")
3. WHEN the part of speech is unavailable, THE Rich_Translation_Service SHALL display the translation without a part of speech indicator

### Requirement 4: Display Definitions

**User Story:** As a Finnish language learner, I want to see clear English definitions of Finnish words, so that I can understand their meanings.

#### Acceptance Criteria

1. WHEN WiktApi returns `glosses` in the definitions array, THE Rich_Translation_Service SHALL display up to 3 definitions in the translation popup
2. THE Rich_Translation_Service SHALL number multiple definitions sequentially
3. WHEN no definitions are available from WiktApi, THE Rich_Translation_Service SHALL display the translation from the Fallback_Translation_Service

### Requirement 5: Display Example Sentences

**User Story:** As a Finnish language learner, I want to see example sentences using the word, so that I can understand how to use it in context.

#### Acceptance Criteria

1. WHEN WiktApi returns example sentences in the definitions, THE Rich_Translation_Service SHALL display up to 2 example sentences in the translation popup
2. THE Rich_Translation_Service SHALL distinguish example sentences from definitions using visual formatting
3. WHEN no example sentences are available, THE Rich_Translation_Service SHALL display the translation without examples

### Requirement 6: Display Pronunciation

**User Story:** As a Finnish language learner, I want to see the IPA pronunciation of words, so that I can learn to pronounce them correctly.

#### Acceptance Criteria

1. WHEN WiktApi returns `sounds` with IPA notation, THE Rich_Translation_Service SHALL display the IPA pronunciation in the translation popup
2. THE Rich_Translation_Service SHALL display IPA notation using the standard format enclosed in square brackets (e.g., "[ˈkoi̯rɑ]")
3. WHEN multiple IPA variants exist, THE Rich_Translation_Service SHALL display the first variant
4. WHEN no IPA pronunciation is available, THE Rich_Translation_Service SHALL display the translation without pronunciation

### Requirement 7: Handle API Errors Gracefully

**User Story:** As a Finnish language learner, I want the app to continue working even when the rich translation service is unavailable, so that I can still get basic translations.

#### Acceptance Criteria

1. WHEN the WiktApi request times out after 5 seconds, THE Rich_Translation_Service SHALL fall back to the Fallback_Translation_Service
2. WHEN WiktApi returns an HTTP error status, THE Rich_Translation_Service SHALL fall back to the Fallback_Translation_Service
3. WHEN falling back, THE Rich_Translation_Service SHALL display the basic translation without rich context
4. THE Rich_Translation_Service SHALL log errors to the browser console for debugging purposes

### Requirement 8: Maintain Frontend-Only Architecture

**User Story:** As a developer, I want the rich translation feature to remain frontend-only, so that the application can be deployed without a backend server.

#### Acceptance Criteria

1. THE Rich_Translation_Service SHALL make all API calls directly from the browser using the fetch API
2. THE Rich_Translation_Service SHALL NOT require any server-side code or API routes
3. THE Rich_Translation_Service SHALL handle CORS constraints by using APIs that support cross-origin requests

### Requirement 9: Design for Language Extensibility

**User Story:** As a developer, I want the rich translation service to be language-agnostic, so that the app can support additional languages in the future.

#### Acceptance Criteria

1. THE Rich_Translation_Service SHALL accept a language code parameter in all function signatures
2. THE Rich_Translation_Service SHALL use the language code parameter when constructing WiktApi URLs
3. THE Rich_Translation_Service SHALL NOT hardcode "fi" (Finnish) as the only supported language
4. WHILE the initial implementation supports Finnish, THE Rich_Translation_Service SHALL be structured to allow adding other languages without code refactoring

### Requirement 10: Update Translation Popup UI

**User Story:** As a Finnish language learner, I want the translation popup to display rich context in an organized layout, so that I can easily read and understand all the information.

#### Acceptance Criteria

1. WHEN rich translation data is available, THE SelectionTranslationPopup component SHALL display the lemma, part of speech, definitions, examples, and pronunciation in a structured layout
2. THE SelectionTranslationPopup component SHALL maintain responsive design for mobile and desktop viewports
3. WHEN loading rich translation data, THE SelectionTranslationPopup component SHALL display a loading indicator
4. WHEN only fallback translation is available, THE SelectionTranslationPopup component SHALL display the basic translation in the existing format

### Requirement 11: Parse WiktApi JSON Response

**User Story:** As a developer, I want a reliable parser for WiktApi responses, so that the application can correctly extract linguistic data.

#### Acceptance Criteria

1. WHEN a valid WiktApi JSON response is received, THE Parser SHALL parse it into a structured RichTranslation object
2. WHEN an invalid or malformed WiktApi response is received, THE Parser SHALL return a descriptive error
3. THE Parser SHALL handle the WiktApi response structure including nested `definitions`, `glosses`, `examples`, `sounds`, `forms`, and `form_of` fields
4. FOR ALL valid WiktApi responses, parsing SHALL complete within 100ms

### Requirement 12: Round-Trip Data Integrity

**User Story:** As a developer, I want confidence that parsed translation data can be serialized and deserialized correctly, so that caching and storage features work reliably.

#### Acceptance Criteria

1. FOR ALL valid RichTranslation objects, serializing to JSON then parsing back SHALL produce an equivalent object
2. THE Parser SHALL preserve all fields during serialization and deserialization
3. THE Parser SHALL handle optional fields (examples, pronunciation) correctly during round-trip operations