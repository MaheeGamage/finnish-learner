---
status: to-do
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
- [ ] Redesign the connect/manage UI: move the sheet field out of the cramped nav into a
      clearer surface (settings/connect panel or modal) that shows the current connection state.
- [ ] Fix the mobile layout: the fixed top-right nav overlaps the centered title on small
      screens (see screenshots). Nav must not cover content on mobile.
- [ ] Validate on connect: when the user enters a sheet URL/ID, check it is reachable with
      their token and has the required `Finnish` / `Translation` headers; show a clear ✓
      connected state or an actionable error (e.g. "add a `Finnish` column"). Can repurpose
      the leftover [api/sheets/verify/route.ts](../../src/app/api/sheets/verify/route.ts).

### Save-failure notifications
- [ ] Add a lightweight non-blocking notification surface (toast/snackbar): dismissible,
      auto-hiding, never blocks the reading flow. Reused by connect-validation feedback above.
- [ ] Make `saveVocab` report failure: check the response (`!res.ok`) and the catch path, and
      trigger a notification instead of swallowing it. Success stays silent (or subtle).
- [ ] Avoid spam: don't fire a notice per word on repeated failures (e.g. coalesce / rate-limit).

### Verify
- [ ] Connect a valid sheet (✓), connect a sheet missing headers (clear error); nav/title are
      usable on both mobile and desktop.
- [ ] Force a save failure (disconnect the sheet or let the token expire) → a non-blocking
      notice appears, reading is uninterrupted, and a later successful save is silent.

## Done when
A user can connect their sheet through a clear UI that confirms the sheet is valid (or explains
what to fix), the top nav never overlaps page content on mobile, and a failed vocab save
surfaces a non-blocking, dismissible notice instead of failing silently.

## Outputs
<!-- fill in as work completes -->

## Log
- 2026-06-13: Split from [[task-006_google-sheets-adapter]] — covers UI concern #2 (friendlier
  sheet entry + mobile overlap) and #3 (validate the sheet on connect). [human + ai]
- 2026-06-14: Merged in former task-009 (save-failure notifications) [human] — both are
  sheet-integration UI/UX and share one toast/notification surface (connect validation + save
  failures), so they ship together. Note: [[task-007_oauth-token-refresh]] removes the
  token-expiry cause of silent failures but not the others (502/network), so the notice still
  matters.
