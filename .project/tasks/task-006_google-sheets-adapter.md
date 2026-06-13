---
status: to-do
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
- [ ] Implement `GoogleSheetsVocabRepository` (and `GoogleSheetsKnowledgeRepository` if
      two ports) using `getSheetsClient()` from `src/lib/googleSheetsClient.ts`.
- [ ] Provision the user's sheet on first sign-in (create tabs + headers if missing).
- [ ] Wire the new adapter into the app in place of `localStorageVocabRepository`.
- [ ] Verify: sign in → save a word while reading → open Google Sheet → row appears.

## Done when
A word saved while reading shows up as a row in the user's Google Sheet.

## Outputs
<!-- fill in as work completes -->

## Log