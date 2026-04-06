# Implementation Plan: Rich Translation Context

## Overview

This implementation adds rich linguistic context to the translation feature using WiktApi. The work is organized into logical phases: types and interfaces, API client, parser, service layer, and UI integration.

## Tasks

- [ ] 1. Set up core types and interfaces
  - [x] 1.1 Create RichTranslation type definitions
    - Create `src/types/richTranslation.ts` with RichTranslation, PartOfSpeech, Definition, Example interfaces
    - _Requirements: 1.2, 11.3_

  - [x] 1.2 Create WiktApi response type definitions
    - Create `src/types/wiktApi.ts` with WiktApiResponse, WiktApiEntry, WiktApiSense, WiktApiSound, WiktApiForm, WiktApiFormOf interfaces
    - _Requirements: 11.3_

  - [ ]* 1.3 Write property test for round-trip data integrity
    - **Property 11: Round-Trip Data Integrity**
    - **Validates: Requirements 12.1, 12.2, 12.3**

- [ ] 2. Implement WiktApi client
  - [x] 2.1 Create WiktApi client module
    - Create `src/utils/wiktApiClient.ts` with fetchWordEntry function
    - Implement URL construction following WiktApi format
    - Add timeout handling (5 seconds)
    - _Requirements: 1.5, 7.1, 8.1, 8.2, 8.3_

  - [ ]* 2.2 Write property test for URL construction
    - **Property 1: URL Construction**
    - **Validates: Requirements 1.5, 9.2**

  - [ ]* 2.3 Write unit tests for WiktApi client
    - Test timeout handling
    - Test HTTP error responses
    - Test network failure handling
    - _Requirements: 7.1, 7.2_

- [ ] 3. Implement WiktApi parser
  - [x] 3.1 Create part of speech mapper
    - Create `src/utils/partOfSpeechMap.ts` with POS_MAPPING constant and mapPartOfSpeech function
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 3.2 Write property test for part of speech mapping
    - **Property 4: Part of Speech Mapping**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 3.3 Create grammatical tags formatter
    - Create `src/utils/grammaticalTags.ts` with TAG_DISPLAY constant and formatGrammaticalTags function
    - _Requirements: 2.3_

  - [ ]* 3.4 Write property test for grammatical tag formatting
    - **Property 8: Grammatical Tag Formatting**
    - **Validates: Requirements 2.3**

  - [x] 3.5 Create WiktApi parser module
    - Create `src/utils/wiktApiParser.ts` with parseResponse, extractPartOfSpeech, extractDefinitions, extractPronunciation, extractLemma functions
    - _Requirements: 1.2, 2.1, 2.2, 3.1, 4.1, 4.2, 5.1, 5.3, 6.1, 6.2, 6.3, 6.4, 11.1, 11.2, 11.3_

  - [ ]* 3.6 Write property test for valid response parsing
    - **Property 2: Valid Response Parsing**
    - **Validates: Requirements 1.2, 11.1, 11.3**

  - [ ]* 3.7 Write property test for lemma extraction
    - **Property 3: Lemma Extraction**
    - **Validates: Requirements 1.3, 2.2**

  - [ ]* 3.8 Write property test for definition limiting
    - **Property 5: Definition Limiting and Formatting**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 3.9 Write property test for example handling
    - **Property 6: Example Handling**
    - **Validates: Requirements 5.1, 5.3**

  - [ ]* 3.10 Write property test for pronunciation formatting
    - **Property 7: Pronunciation Formatting**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [ ]* 3.11 Write property test for invalid response handling
    - **Property 10: Invalid Response Handling**
    - **Validates: Requirements 11.2**

- [x] 4. Checkpoint - Ensure parser tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement RichTranslationService
  - [x] 5.1 Create RichTranslationService module
    - Create `src/utils/richTranslationService.ts` with fetchRichTranslation, fetchWiktApiEntry, createFallbackTranslation functions
    - Implement fallback to existing translator service
    - Add error logging
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.2 Write property test for fallback on error
    - **Property 9: Fallback on Error**
    - **Validates: Requirements 7.2, 7.3**

  - [ ]* 5.3 Write unit tests for RichTranslationService
    - Test fallback behavior
    - Test timeout handling
    - Test form_of detection and lemma fetching
    - _Requirements: 1.3, 1.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 6. Update UI components
  - [x] 6.1 Update SelectionTranslationPopup for rich translation display
    - Modify `src/components/SelectionTranslationPopup.tsx` to use fetchRichTranslation
    - Add UI sections for lemma, part of speech, definitions, examples, pronunciation
    - Add loading state for rich translation
    - Maintain responsive design
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 5.2, 6.1, 10.1, 10.2, 10.3, 10.4_

  - [x] 6.2 Update TranslatableWord component for rich translation
    - Modify `src/components/TranslatableWord.tsx` to use fetchRichTranslation
    - Update tooltip to show rich context when available
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integration and final validation
  - [x] 8.1 Wire all components together
    - Verify RichTranslationService integrates with UI components
    - Verify fallback chain works correctly
    - _Requirements: 1.1, 1.4, 7.3_

  - [ ]* 8.2 Write integration tests
    - Test end-to-end flow from word selection to UI display
    - Test fallback behavior when WiktApi is unavailable
    - _Requirements: 1.1, 1.4, 7.3, 10.1, 10.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The design uses TypeScript (Next.js), so all code examples will be in TypeScript