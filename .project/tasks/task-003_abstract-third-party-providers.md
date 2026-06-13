---
status: done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Put each third-party tool behind a port (interface) + adapter so it can be swapped without
touching the code that uses it. This is a behaviour-shaping change, kept separate from the
pure-move refactor [[task-002_restructure-by-component]] (do this after it lands).

Follows the port/adapter convention in [module conventions §5](../../docs/module-conventions.md).
Keep it lightweight — one interface + one adapter each, no provider registry.

Ports to introduce (start with the two that already have real implementations):

- [x] `Translator` in `translation` — `translate(word, from, to)`. Adapter: MyMemory
      (current `translator.ts`). `richTranslationService` depends on the interface.
- [x] `Dictionary` in `translation` — `lookup(word)` → lemma, part of speech, definitions.
      Adapter: Wiktionary (wraps the internal `wiktionary/` client+parser). Separate port
      from `Translator` — a dictionary is not a translator.
- [x] `ContentSource` in `content` — provide reading content. Adapter: local files
      (`fs` + gray-matter). (Lower priority — only one source today.)
- [x] `VocabRepository` in `vocab-store` — persist vocab + knowledge. Adapter: localStorage.
      Sets up the Google-Sheet swap ([[001-storage-google-sheet]]); coordinate with the
      persistence work so this isn't built twice.

## Done when
Each third-party tool is reached only through its port interface; swapping an adapter needs
no change to the consuming code; app builds and behaves unchanged.

## Outputs

**translation**
- [ports/Translator.ts](../../src/modules/translation/ports/Translator.ts) — `translate(word, from, to)` interface
- [ports/Dictionary.ts](../../src/modules/translation/ports/Dictionary.ts) — `lookup(word, lang)` interface + `DictionaryEntry` type
- [adapters/GoogleMyMemoryTranslator.ts](../../src/modules/translation/adapters/GoogleMyMemoryTranslator.ts) — wraps the existing Google/MyMemory translator
- [adapters/WiktionaryDictionary.ts](../../src/modules/translation/adapters/WiktionaryDictionary.ts) — wraps wiktionary client+parser; absorbs lemma-resolution logic from `richTranslationService`
- [services/richTranslationService.ts](../../src/modules/translation/services/richTranslationService.ts) — updated to depend on ports only; no direct wiktionary imports

**vocab-store**
- [ports/VocabRepository.ts](../../src/modules/vocab-store/ports/VocabRepository.ts) — `record/getAll/clear` interface
- [adapters/LocalStorageVocabRepository.ts](../../src/modules/vocab-store/adapters/LocalStorageVocabRepository.ts) — wraps `vocabStorage.ts`

**content**
- [ports/ContentSource.ts](../../src/modules/content/ports/ContentSource.ts) — `list/getById` interface
- [adapters/LocalFilesContentSource.ts](../../src/modules/content/adapters/LocalFilesContentSource.ts) — wraps `contentLoader.ts`

**docs**
- [docs/module-conventions.md](../../docs/module-conventions.md) — §3 table updated with `ports/` and `adapters/` folders; §5 expanded with pattern explanation, file links, and swap guide

## Log
- [ai] All four ports and adapters implemented. `richTranslationService` now depends only on
  `Translator` and `Dictionary` interfaces. All module `index.ts` public APIs unchanged —
  no consumer code required updating. Build passes clean.
