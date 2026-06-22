---
status: done    # to-do | in-progress | in-review | done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Wiktionary (the rich `Dictionary`) isn't returning good results, yet it's hardcoded as the
first source — [richTranslationService](../../src/modules/translation/services/richTranslationService.ts)
always tries `wiktionaryDictionary` and only falls back to the `Translator` chain
(Google → MyMemory). Make the **source order configurable**, default it to **Google first**, and
let the user change it from the app.

**Ordering model — pure priority.** Sources are tried in the configured order; the **first that
returns a usable result wins, the rest are skipped**. So "Google first" = the user sees Google's
translation and Wiktionary's grammar (lemma/POS/definitions) is not fetched. (Decided over
"always enrich" — keep it a literal reorder.)

**Default:** Google first, then Wiktionary. Today's behaviour (Wiktionary first) becomes the
other selectable order.

**Config home (mirror the SRS settings pattern, [[task-011_expose-srs-tuning-config]]):** an
isomorphic settings module in `translation/` (schema + parse/validate + localStorage
read/write), surfaced on the existing **/settings** page, persisted to **localStorage**
(per-device). One end-to-end task (logic + UI together).

### Design wrinkle to resolve while building
The two sources return different shapes — Wiktionary → full `RichTranslation` (rich fields set),
Google/MyMemory → only `fallbackTranslation`. Today the `source` tag is `'wiktapi'` vs
`'fallback'`. Folding both into one ordered list means `fetchRichTranslation` iterates the
configured sources and maps whichever wins into `RichTranslation`. Keep MyMemory as Google's own
internal fallback (it's a `Translator` backup, not a user-facing "source") — the user-facing
order is **Google ⟷ Wiktionary**, not a 3-way list, unless we decide otherwise.

### Build (end-to-end)
- [x] `translation/` settings module: source-order schema (`['google','wiktionary']` default) +
      parse/validate + localStorage load/save/clear. Isomorphic (pure parse usable server-side if
      lookup ever moves there).
- [x] Refactor `fetchRichTranslation` to iterate the configured order, first-usable-result-wins,
      mapping the winner into `RichTranslation` (rich fields when Wiktionary, `fallbackTranslation`
      when Google).
- [x] /settings UI: a control to pick the order (Google first / Wiktionary first), in the
      existing design language; persists to localStorage; reader picks it up on next lookup.
- [x] typecheck + lint + production build clean.

## Done when
The user can switch the translation source order from /settings, the default is Google-first, and
a word lookup in the reader uses the chosen order (first source that returns a result wins).

## Outputs
- [settings.ts](../../src/modules/translation/settings.ts) — `TranslationSource`, `SourceOrder`,
  `DEFAULT_SOURCE_ORDER` (`['google','wiktionary']`), `parseSourceOrder`/`parseSourceOrderJson`,
  localStorage load/save/clear (key `finnish_translation_source_order`).
- [richTranslationService.ts](../../src/modules/translation/services/richTranslationService.ts) —
  iterates `loadSourceOrder()`, first non-null source wins; per-source resolvers (Wiktionary →
  rich, Google → `fallbackTranslation` with MyMemory still its internal fallback). Empty fallback
  only when all sources fail.
- [TranslationSettingsPanel.tsx](../../src/modules/translation/components/TranslationSettingsPanel.tsx)
  — reorderable priority list (ranked rows + up/down arrows) that keeps the same shape for any
  number of sources; applies + persists immediately (toast), seeded-then-loaded to avoid SSR
  hydration mismatch.
- [settings/page.tsx](../../src/app/settings/page.tsx) — page generalized to **Settings** with a
  **Translation** section (new panel) above the existing **Quiz** section.
- [index.ts](../../src/modules/translation/index.ts) — barrel re-exports the settings API +
  `TranslationSettingsPanel`.

## Log
- 2026-06-22: Drafted [human + ai]. Decisions captured: **pure priority** ordering (first success
  wins, no enrich), **default Google-first**, configurable from **/settings + localStorage**
  (mirrors [[task-011_expose-srs-tuning-config]]), built as **one end-to-end task**. Awaiting
  [human] approval to start.
- 2026-06-22: **Built end-to-end** [ai]. `settings.ts` source-order schema + validate + localStorage;
  refactored `fetchRichTranslation` to a configured-order loop (per-source resolvers, first usable
  wins, errors fall through). `source` tag unchanged (`'wiktapi'` / `'fallback'`); MyMemory stays
  Google's internal fallback (2-way user-facing order). New `TranslationSettingsPanel` (immediate
  apply + toast) on a generalized `/settings` page (Translation + Quiz sections). typecheck + lint +
  production build clean (`/settings` route present). Static checks only — awaiting live [human]
  review.
- 2026-06-22: **UI made N-source ready** [human-requested]. Replaced the 2-only segmented toggle
  with a reorderable ranked list (up/down arrows) that keeps the same shape for any number of
  sources. `parseSourceOrder` now normalizes any saved/partial order (drops unknowns, appends
  missing known sources in `KNOWN_SOURCES` order) so adding a translator preserves the user's
  existing ranking instead of resetting it. Adding a source = `KNOWN_SOURCES` + a resolver +
  `SOURCE_META` entry; UI/plumbing unchanged. typecheck + lint + build clean.
