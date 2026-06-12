---
status: to-do
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

- [ ] `Translator` in `translation` — `translate(word, from, to)`. Adapter: MyMemory
      (current `translator.ts`). `richTranslationService` depends on the interface.
- [ ] `Dictionary` in `translation` — `lookup(word)` → lemma, part of speech, definitions.
      Adapter: Wiktionary (wraps the internal `wiktionary/` client+parser). Separate port
      from `Translator` — a dictionary is not a translator.
- [ ] `ContentSource` in `content` — provide reading content. Adapter: local files
      (`fs` + gray-matter). (Lower priority — only one source today.)
- [ ] `VocabRepository` in `vocab-store` — persist vocab + knowledge. Adapter: localStorage.
      Sets up the Google-Sheet swap ([[001-storage-google-sheet]]); coordinate with the
      persistence work so this isn't built twice.

## Done when
Each third-party tool is reached only through its port interface; swapping an adapter needs
no change to the consuming code; app builds and behaves unchanged.
