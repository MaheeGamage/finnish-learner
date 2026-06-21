---
status: in-review    # to-do | in-progress | in-review | done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Show an **example sentence** on the quiz card when the answer is revealed — so the user sees
the word used in context. The example comes from a user-maintained **`Example` column** in the
Google Sheet (read-only — the app never writes it, per [[003-vocab-sheet-design]]). Shown after
reveal on **both** directions (FI→EN and EN→FI), only when the word has an example.

The example is in the **learning language** (source language), so its text carries the **same
hover / touch / selection translation** the Reader provides — kept language-agnostic (label it
"Example", not "Finnish example") so future languages work unchanged.

**Key design point — reuse, not duplicate.** The Reader's interactive translation lives in
[TranslatableWord](../../src/modules/reader/components/TranslatableWord.tsx) +
[SelectionTranslationPopup](../../src/modules/reader/components/SelectionTranslationPopup.tsx),
but the page ([page.tsx](../../src/app/page.tsx)) does the tokenization + active-token / state
wiring inline. To give the quiz card the same behaviour without copy-paste, extract a reusable
**`TranslatableText`** component (tokenize a string → `TranslatableWord`s + its own active-index
state + a `SelectionTranslationPopup`). Reader page and quiz card both consume it. This keeps
the modules independently operable (a given constraint).

### Build — Phase A (data/plumbing, no visual design) — done
- [x] `vocab-test/types.ts`: add `example: string | null` to `KnowledgeItem`.
- [x] Adapter `getAll()`: read the `Example` column by header name (read-only; absent → null);
      add to each item. Never written in `recordResult`.
- [x] Confirmed `example` flows through the session route → `client.ts` (rides on
      `QuizCard.item`; selector keeps the full item; route returns `{ cards }` — no contract change).
- [x] typecheck + lint + build clean.

### Build — Phase B (UI / reuse) — done
- [x] Extracted reusable `TranslatableText`
      ([TranslatableText.tsx](../../src/modules/reader/components/TranslatableText.tsx)) from the
      Reader page wiring (tokenizer + active-index + its own `SelectionTranslationPopup`).
- [x] Refactored [page.tsx](../../src/app/page.tsx) to consume it (Reader behaviour unchanged;
      dropped its inline tokenizer, `activeWordIndex` state, and page-level popup).
- [x] Made the selection popup's scope configurable (`scopeSelector`, default
      `[data-translatable-text]`) so it works on the quiz card without leaking the Reader's
      `#reading-content` id.
- [x] Render the example under the answer in
      [QuizSession](../../src/modules/vocab-test/components/QuizSession.tsx) on reveal, **both**
      directions, source = learning language (`fi`); hidden when no example. Hover/touch +
      selection both work, and only after reveal (the example only mounts then).
- [x] typecheck + lint + build clean (`/` and `/test` routes present).

## Done when
On reveal, a card whose sheet row has an `Example` shows that sentence under the answer (both
directions), and hovering / touching / selecting words in it triggers translation exactly like
the Reader. Cards without an example show nothing extra. The app never writes the `Example`
column.

## Outputs
- [types.ts](../../src/modules/vocab-test/types.ts) — `KnowledgeItem.example`.
- [GoogleSheetsKnowledgeRepository.ts](../../src/modules/vocab-test/adapters/GoogleSheetsKnowledgeRepository.ts)
  — reads the user-owned `Example` column (read-only).
- [TranslatableText.tsx](../../src/modules/reader/components/TranslatableText.tsx) — new reusable
  interactive-text component (exported from [reader/index.ts](../../src/modules/reader/index.ts)).
- [SelectionTranslationPopup.tsx](../../src/modules/reader/components/SelectionTranslationPopup.tsx)
  — configurable `scopeSelector`.
- [page.tsx](../../src/app/page.tsx) — Reader refactored onto `TranslatableText`.
- [QuizSession.tsx](../../src/modules/vocab-test/components/QuizSession.tsx) — example shown on reveal.

## Log
- 2026-06-20: Drafted [human + ai]. Decided: example source = user-owned `Example` sheet column
  (read-only, per [[003-vocab-sheet-design]]); shown after reveal on both directions; learning-
  language-agnostic labelling; example text reuses the Reader's hover/touch/selection translation
  via a new reusable `TranslatableText` component (extract from the Reader page, don't duplicate)
  [human choices]. Phasing data→UI per [[plan-before-ui-changes]]. Starting Phase A; bringing the
  Phase B plan for approval before building UI.
- 2026-06-20: **Phase A built** [ai]. `KnowledgeItem.example` added; adapter reads the user-owned
  `Example` column read-only (absent → null, never written); verified it rides through the selector
  → session route → client with no API-contract change. typecheck + lint + build clean.
- 2026-06-20: Phase B approved [human]: extract + refactor the Reader; on the quiz card enable
  **both** hover/touch and the bottom selection popup, but only after reveal.
- 2026-06-20: **Phase B built** [ai]. Extracted `TranslatableText` (tokenizer + active-word state +
  its own selection popup); refactored the Reader page onto it (behaviour unchanged). Made the
  popup's selection scope configurable (`scopeSelector`, default `[data-translatable-text]`) so the
  quiz card gets selection translation without borrowing the Reader's `#reading-content` id. Quiz
  card now shows the `Example` under the answer on reveal, both directions, with full hover/touch +
  selection translation; hidden when no example. typecheck + lint + build clean. Static checks only
  — awaiting live [human] review.
