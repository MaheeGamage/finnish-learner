---
status: done
owner: both
goal: "[[002-build-v2-mvp]]"
---
## Description

Make connecting a vocabulary Google Sheet friendly and trustworthy, and make save failures
visible. Today the sheet ID is typed into a cramped field in the fixed top nav, with no
confirmation the sheet is usable; on narrow screens the fixed nav overlaps the page title;
and `saveVocab` is fire-and-forget, so a failed save (bad sheet 502, expired token 401,
network error) is invisible while reading. This task redesigns the connect flow, validates
the sheet on connect, and adds a non-blocking notice when a save fails — all sharing one
notification surface.

### Connect / manage UI

- [X]  Redesign the connect/manage UI: moved the sheet field into a centered connect **modal**
  opened from a sheet-status **pill** in the new top bar; modal shows connection state +
  disconnect.
- [X]  Fix the mobile layout: replaced the fixed top-right nav with a full-width sticky top bar
  (in normal flow), so it no longer overlaps the page title on mobile.
- [X]  Validate on connect: modal calls read-only `GET /api/sheets/validate`; shows ✓ (success
  toast) or an actionable error (missing headers / unreachable / sign in first). Added a new
  validate route rather than repurposing `verify` (kept as the setup-guide auth smoke-test).

### Save-failure notifications

- [X]  Add a lightweight non-blocking notification surface (toast/snackbar): dismissible,
  auto-hiding, never blocks the reading flow. Reused by connect-validation feedback above.
- [X]  Make `saveVocab` report failure: check the response (`!res.ok`) and the catch path, and
  trigger a notification instead of swallowing it. Success stays silent (or subtle).
- [X]  Avoid spam: don't fire a notice per word on repeated failures (e.g. coalesce / rate-limit).

### Verify

- [X]  Connect a valid sheet (✓), connect a sheet missing headers (clear error); nav/title are
  usable on both mobile and desktop.
- [X]  Force a save failure (disconnect the sheet or let the token expire) → a non-blocking
  notice appears, reading is uninterrupted, and a later successful save is silent.

## Done when

A user can connect their sheet through a clear UI that confirms the sheet is valid (or explains
what to fix), the top nav never overlaps page content on mobile, and a failed vocab save
surfaces a non-blocking, dismissible notice instead of failing silently.

## Outputs

- [notifications module](../../src/modules/notifications/) — client toast pub/sub
  ([toastStore.ts](../../src/modules/notifications/toastStore.ts)) + [ToastHost.tsx](../../src/modules/notifications/ToastHost.tsx),
  mounted in [layout.tsx](../../src/app/layout.tsx). Styling minimal; skinned in the UI pass.
- [saveVocab.ts](../../src/modules/vocab-store/saveVocab.ts) — reports save failures via a
  coalesced error toast (`!res.ok` + catch).
- [api/sheets/validate/route.ts](../../src/app/api/sheets/validate/route.ts) +
  `validateVocabSheet()` in [GoogleSheetsVocabRepository.ts](../../src/modules/vocab-store/adapters/GoogleSheetsVocabRepository.ts)
  — read-only sheet validation (reachable + has `Finnish`/`Translation`).
- [TopBar.tsx](../../src/components/TopBar.tsx) + [UserMenu.tsx](../../src/components/UserMenu.tsx) /
  [UserMenuDropdown.tsx](../../src/components/UserMenuDropdown.tsx) — full-width sticky bar; user
  menu = identity + Sign out (replaces the floating nav + `AuthButton`).
- [VocabSheetPill.tsx](../../src/modules/vocab-store/components/VocabSheetPill.tsx) +
  [ConnectSheetModal.tsx](../../src/modules/vocab-store/components/ConnectSheetModal.tsx) +
  [validateSheet.ts](../../src/modules/vocab-store/validateSheet.ts) — status pill → connect modal,
  client validation call (replaces `VocabSheetField`).
- [authActions.ts](../../src/lib/authActions.ts) — `signInWithGoogle` / `signOutAction` server actions.

## Log

- 2026-06-13: Split from [[task-006_google-sheets-adapter]] — covers UI concern #2 (friendlier
  sheet entry + mobile overlap) and #3 (validate the sheet on connect). [human + ai]
- 2026-06-14: Merged in former task-009 (save-failure notifications) [human] — both are
  sheet-integration UI/UX and share one toast/notification surface (connect validation + save
  failures), so they ship together. Note: [[task-007_oauth-token-refresh]] removes the
  token-expiry cause of silent failures but not the others (502/network), so the notice still
  matters.
- 2026-06-14: UI design received [human]: full-width top app-bar (logo left; sheet-status pill
  + user-avatar menu right), a centered connect-modal, and a user menu = identity + Sign out
    only (sheet stays in the pill; reading settings stay in the page body). Keeping the current
    app name (not "SuomiRead"). typecheck + lint clean.
- 2026-06-14: Built the design-independent logic (clarified: the toast surface is 100%
  client-side pub/sub — no server; only validation needs a server route since the Google token
  is server-side). Added the notifications module + `ToastHost` (mounted in layout), wired
  `saveVocab` to raise a coalesced error toast on `!res.ok`/catch, and added read-only
  `GET /api/sheets/validate` (`validateVocabSheet`). Kept the existing `/api/sheets/verify`
  auth smoke-test (referenced by docs/setup-guide.md) rather than repurposing it. UI pass next:
  top bar + pill + connect modal + user menu + mobile-overlap fix + toast skinning.
- 2026-06-14: Toast skinned (bottom-right, rounded, content-width with a max cap); verified live
  by [human].
- 2026-06-14: Built the UI pass — full-width sticky `TopBar` (logo + sheet pill + user menu)
  replacing the floating nav (fixes the mobile title overlap); `VocabSheetPill` → `ConnectSheetModal`
  (validate-on-connect with ✓/actionable errors + disconnect); user-avatar dropdown (identity +
  Sign out) via `authActions` server actions. Removed `AuthButton` + `VocabSheetField`. typecheck,
  lint, and production build all clean. Awaiting live verification (connect valid/missing-header
  sheets; mobile/desktop layout).
