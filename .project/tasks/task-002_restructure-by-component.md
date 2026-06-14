---
status: done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Reorganize the repo from technical layers (`components/`, `utils/`, `types/`) into
component modules under `src/modules/<component>/`, each with a public API (index barrel)
and explicit interface contracts where modules talk to each other. Pure refactor — no
behaviour change. Net-new modules (e.g. Vocab Test) are deferred to their own tasks; the
port/adapter abstraction for third-party tools is its own task, [[task-003_abstract-third-party-providers]].

Follows the project's [module conventions](../../docs/module-conventions.md).

Target modules (from existing code): `reader`, `content`, `translation`,
`vocab-store`, `session-history`. Wiktionary (lemma + part-of-speech) is not a top-level
module — it lives inside `translation` as a private internal piece, since only
`richTranslationService` uses it and the Reader only ever sees a `RichTranslation`. (The
v2-components diagram draws it as a peer service; the code already merged it into
translation.) No `shared` module for now — nothing is genuinely cross-cutting yet.

- [x] Map each existing file to a module. (see ## Mapping)
- [x] Create the module folders, each exposing a public API via `index.ts`.
- [x] Define interface contracts at the boundaries (each module's `index.ts` barrel is its
      contract; cross-module access goes only through `@/modules/<name>`).
- [x] Move code and fix imports. `git mv` used to preserve history; `components/`, `utils/`,
      `types/`, `config/` are gone. `textStorage.ts` + `constants.ts` split per the mapping.
- [x] Verify the app builds and behaves as before. Pure move — no behaviour change.
      `tsc --noEmit` shows only the 4 *pre-existing* `RichTranslation` vs `string` errors
      (confirmed identical on the committed baseline via `git stash`); ESLint clean.

## Mapping
Target tree (`← old path` shows where each file comes from). After the move,
`components/`, `utils/`, `types/`, `config/` all disappear.

```
src/
├── app/                                Next.js App Router (stays — thin layer)
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                        composes the reader module
│   └── api/
│       ├── content/
│       │   └── route.ts                → delegates to content module
│       └── session/
│           └── route.ts                → delegates to session-history module
│
└── modules/
    ├── reader/
    │   ├── index.ts                    public API
    │   ├── components/
    │   │   ├── TranslatableWord.tsx
    │   │   ├── SelectionTranslationPopup.tsx
    │   │   └── ContentSelector.tsx
    │   ├── config/
    │   │   ├── selectionConfig.ts      ← config/selectionConfig.ts
    │   │   └── readerConfig.ts         ← config/constants.ts (minus snippet length)
    │   ├── storage.ts                  ← reader parts of utils/textStorage.ts
    │   └── textUtils.ts                ← utils/textUtils.ts
    │
    ├── content/                        flat — 1 file
    │   ├── index.ts                    public API
    │   └── contentLoader.ts            ← utils/contentLoader.ts
    │
    ├── translation/
    │   ├── index.ts                    public API: fetchRichTranslation, RichTranslation
    │   ├── services/
    │   │   ├── richTranslationService.ts  ← utils/richTranslationService.ts
    │   │   └── translator.ts              ← utils/translator.ts
    │   ├── types.ts                    ← types/richTranslation.ts
    │   └── wiktionary/                 internal — NOT re-exported
    │       ├── client.ts               ← utils/wiktApiClient.ts
    │       ├── parser.ts               ← utils/wiktApiParser.ts
    │       ├── partOfSpeechMap.ts      ← utils/partOfSpeechMap.ts
    │       ├── grammaticalTags.ts      ← utils/grammaticalTags.ts
    │       └── types.ts                ← types/wiktApi.ts
    │
    ├── vocab-store/                    flat — 1 file
    │   ├── index.ts                    public API: recordLookup, getLookups, VocabLookup
    │   └── vocabStorage.ts             ← utils/vocabStorage.ts
    │
    └── session-history/                flat — 1 file per role for now
        ├── index.ts                    public API
        ├── SessionSummary.tsx          ← components/SessionSummary.tsx
        ├── sessionExport.ts            ← utils/sessionExport.ts + SESSION_CONTENT_SNIPPET_LENGTH
        ├── storage.ts                  ← session parts of utils/textStorage.ts
        └── types.ts                    ← types/session.ts
```

Subfolders follow the "2+ files of a role" rule: `reader` earns `components/` (3) and
`config/` (2); `translation` earns `services/` (2). `content`, `vocab-store`, and
`session-history` stay flat until a role grows past one file.

## Done when
Code lives in `src/modules/<component>/` modules, each with a public API and boundary
interfaces; cross-module access goes only through those; app builds and behaves unchanged.

## Log
- [ai] Moved all six modules. Each module's `index.ts` is its public contract; `app/` kept
  thin (page composes `reader` + `session-history`; routes delegate to `content` /
  `session-history`). Verified type-neutral via `tsc` + `git stash` baseline compare.
- [ai] Pre-existing bug surfaced, NOT fixed here (out of scope for a pure refactor):
  `tsc` reported 4 errors in `TranslatableWord.tsx` / `SelectionTranslationPopup.tsx` —
  `RichTranslation` compared to / passed as `string`.
- [human] Tested the app end-to-end — works as expected. Restructure accepted; task done.
  Applied some fixes since; `tsc --noEmit` now passes clean, so the `RichTranslation`/`string`
  bug is resolved.