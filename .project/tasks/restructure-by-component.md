---
status: in-progress
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Reorganize the repo from technical layers (`components/`, `utils/`, `types/`) into
component modules under `src/modules/<component>/`, each with a public API (index barrel)
and explicit interface contracts where modules talk to each other. Pure refactor — no
behaviour change. Net-new modules (e.g. Vocab Test) are deferred to their own tasks.

Target modules (from existing code): `reader`, `content`, `translation`,
`vocab-store`, `session-history`. Wiktionary (lemma + part-of-speech) is not a top-level
module — it lives inside `translation` as a private internal piece, since only
`richTranslationService` uses it and the Reader only ever sees a `RichTranslation`. (The
v2-components diagram draws it as a peer service; the code already merged it into
translation.) No `shared` module for now — nothing is genuinely cross-cutting yet.

- [x] Map each existing file to a module. (see ## Mapping)
- [ ] Create the module folders, each exposing a public API via `index.ts`.
- [ ] Define interface contracts at the boundaries (cross-module access goes through them).
- [ ] Move code and fix imports.
- [ ] Verify the app builds and behaves as before.

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
    │   ├── TranslatableWord.tsx
    │   ├── SelectionTranslationPopup.tsx
    │   ├── ContentSelector.tsx
    │   ├── selectionConfig.ts          ← config/selectionConfig.ts
    │   ├── readerConfig.ts             ← config/constants.ts (minus snippet length)
    │   ├── textUtils.ts                ← utils/textUtils.ts
    │   └── readerStorage.ts            ← reader parts of utils/textStorage.ts
    │
    ├── content/
    │   ├── index.ts                    public API
    │   └── contentLoader.ts            ← utils/contentLoader.ts
    │
    ├── translation/
    │   ├── index.ts                    public API: fetchRichTranslation, RichTranslation
    │   ├── richTranslationService.ts   ← utils/richTranslationService.ts
    │   ├── translator.ts               ← utils/translator.ts
    │   ├── types.ts                    ← types/richTranslation.ts
    │   └── wiktionary/                 internal — NOT re-exported
    │       ├── client.ts               ← utils/wiktApiClient.ts
    │       ├── parser.ts               ← utils/wiktApiParser.ts
    │       ├── partOfSpeechMap.ts      ← utils/partOfSpeechMap.ts
    │       ├── grammaticalTags.ts      ← utils/grammaticalTags.ts
    │       └── types.ts                ← types/wiktApi.ts
    │
    ├── vocab-store/
    │   ├── index.ts                    public API: recordLookup, getLookups, VocabLookup
    │   └── vocabStorage.ts             ← utils/vocabStorage.ts
    │
    └── session-history/
        ├── index.ts                    public API
        ├── SessionSummary.tsx          ← components/SessionSummary.tsx
        ├── sessionExport.ts            ← utils/sessionExport.ts
        ├── types.ts                    ← types/session.ts
        └── sessionStorage.ts           ← session parts of utils/textStorage.ts
                                          + SESSION_CONTENT_SNIPPET_LENGTH
```

## Done when
Code lives in `src/modules/<component>/` modules, each with a public API and boundary
interfaces; cross-module access goes only through those; app builds and behaves unchanged.