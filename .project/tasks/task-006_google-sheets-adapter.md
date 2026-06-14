---
status: done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Swap `LocalStorageVocabRepository` for a `GoogleSheetsVocabRepository` so vocabulary
persists in the user's Google Sheet across sessions and devices. Auth and the port
interfaces are already in place — this task designs the sheet and builds the adapter.

## Steps

- [x] **Decide** (human + ai): 1-tab sheet, columns by header name, app-owned headers
      `Finnish | Translation | Status | Last Tested`, status values `New / Learning / Known`
      as a named constant. Recorded in [003-vocab-sheet-design](../decisions/003-vocab-sheet-design.md).
- [x] Implement `GoogleSheetsVocabRepository` using `getSheetsClient()`. Exposed as a
      `createGoogleSheetsVocabRepository(spreadsheetId)` factory — the sheet is chosen
      per-user at runtime, not via env (see Log).
- [x] Provision headers (single tab, per decision 003): the user supplies a sheet with
      `Finnish` / `Translation` headers; the app auto-adds `Status` / `Last Tested` if missing.
      The app does not create the sheet/tab — the user provides their own.
- [x] De-duplicate on save: a word already present (case-insensitive, trimmed) is not added
      again. Updating an existing word's knowledge/status is out of scope (quiz flow).
- [x] Wire the new adapter into the app: reader → `saveVocab` → `POST /api/vocab` (sheet id
      via `x-vocab-sheet-id` header) → adapter. Sheet chosen via "Vocab sheet" field in nav.
- [x] Verify: sign in → save a word while reading → open Google Sheet → row appears.
      Confirmed live by [human] 2026-06-13.
- [x] Add an env flag to enable/disable saving (default on), so the user can read without
      writing to the sheet. (Impl detail: client `NEXT_PUBLIC_*` vs server-side gate — decide
      when building.)

## Done when
A word saved while reading shows up as a row in the user's Google Sheet.

## Outputs
- [GoogleSheetsVocabRepository.ts](../../src/modules/vocab-store/adapters/GoogleSheetsVocabRepository.ts) — `createGoogleSheetsVocabRepository(spreadsheetId)`
- [sheetSettings.ts](../../src/modules/vocab-store/sheetSettings.ts) — per-user sheet id storage + URL→ID parsing
- [saveVocab.ts](../../src/modules/vocab-store/saveVocab.ts) — client → `/api/vocab`, sends sheet id header
- [api/vocab/route.ts](../../src/app/api/vocab/route.ts) — auth-gated GET/POST
- `VocabSheetField.tsx` — nav input for the sheet (superseded in [[task-008_vocab-sheet-connect-ux]] by the pill + connect modal)
- Reader wiring: [TranslatableWord.tsx](../../src/modules/reader/components/TranslatableWord.tsx), [SelectionTranslationPopup.tsx](../../src/modules/reader/components/SelectionTranslationPopup.tsx)

## Log
- 2026-06-13: Implemented adapter, API route, client + reader wiring (prior session, uncommitted).
- 2026-06-13: Sheet is chosen per-user at runtime (paste URL/ID into the nav field, stored in
  localStorage, sent via `x-vocab-sheet-id` header) instead of the prior code's single
  `VOCAB_SPREADSHEET_ID` env var. Refactored the adapter from a singleton to a factory; removed
  the env var from `.env.local.example`. Consistent with decision [[003-vocab-sheet-design]]
  ("on connecting a sheet, the app checks for Finnish/Translation"); the env-vs-localStorage
  choice is a reversible impl detail, so it stays here rather than in a decision record.
- 2026-06-13: Added de-duplication in `record` — reads the `Finnish` column and skips append
  if the (normalized) word already exists. Knowledge/status updates for existing words remain
  out of scope (quiz flow).
- 2026-06-13: Confirmed single-tab sheet (decision 003); reworded the provisioning step. The
  user provides the sheet; the app only ensures the app-owned headers exist.
- 2026-06-13: OAuth token refresh split out to its own task (cross-cutting auth concern, affects
  all Google API calls) — see [[task-007_oauth-token-refresh]].
- 2026-06-13: typecheck + lint clean; dev server boots; `/api/vocab` returns 401 unauth as
  expected.
- 2026-06-13: `/api/vocab` POST now returns 502 (not 200) when the Sheets write fails, so a
  failed save no longer looks like success. [human + ai]
- 2026-06-13: **Verified end-to-end** — word saved while reading appeared as a row in the sheet.
  During testing, saves 401'd with an `invalid_token` from Google; root cause was an expired
  access token that a re-sign-in didn't always refresh. A full sign-out → sign-in fixed it.
  This is exactly [[task-007_oauth-token-refresh]] — without refresh, saves silently stop ~1h
  after sign-in. [human]
- 2026-06-13: Reopened (in-review → in-progress) to add an env on/off toggle for saving
  [human request]. The core sheet-save flow stays verified; only the toggle is outstanding.
  Sheet-connect UX + validation split to [[task-008_vocab-sheet-connect-ux]].
- 2026-06-13: Added env save-toggle (`NEXT_PUBLIC_VOCAB_SAVING_ENABLED`, optional server
  override `VOCAB_SAVING_ENABLED`) with default-on behavior. When disabled, client skips
  save requests and server POST short-circuits safely.
- 2026-06-14: **Done** [human]. All steps complete; core save flow verified live. Setup/run
  instructions captured in [docs/setup-guide.md](../../docs/setup-guide.md). Follow-ups continue
  in [[task-007_oauth-token-refresh]] (token refresh) and [[task-008_vocab-sheet-connect-ux]]
  (connect UX + validation + failed-save notices).