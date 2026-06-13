---
status: to-do
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
`saveVocab` is fire-and-forget and ignores the response, so a failed save is invisible while
reading — a bad/disconnected sheet (502), an expired token (401), or a network error all fail
silently. Add a non-blocking way to tell the user a save failed, without interrupting reading.

- [ ] Add a lightweight non-blocking notification surface (toast/snackbar): dismissible,
      auto-hiding, never blocks the reading flow.
- [ ] Make `saveVocab` report failure: check the response (`!res.ok`) and the catch path, and
      trigger a notification instead of swallowing it. Success stays silent (or subtle).
- [ ] Avoid spam: don't fire a notice per word on repeated failures (e.g. coalesce / rate-limit).
- [ ] Verify: force a failure (disconnect the sheet or let the token expire) → a non-blocking
      notice appears; reading is uninterrupted; a later successful save is silent.

## Done when
A failed vocab save surfaces a non-blocking, dismissible notice instead of failing silently.

## Outputs
<!-- fill in as work completes -->

## Log
- 2026-06-13: Raised during task-006 verification — silent failures noted. Shares a notification
  component with [[task-008_vocab-sheet-connect-ux]] (validation feedback). Note: [[task-007_oauth-token-refresh]]
  removes the token-expiry cause but not the others, so this is still worthwhile. [human + ai]
