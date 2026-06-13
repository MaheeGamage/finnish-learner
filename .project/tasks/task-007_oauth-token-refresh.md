---
status: to-do
owner: ai
goal: "[[002-build-v2-mvp]]"
---

## Description
The Google access token expires after ~1h. [auth.ts](../../src/lib/auth.ts) stores the
`refreshToken` and `expiresAt` but never refreshes — so after expiry every Google API call
(vocab save/load, sheets) silently 401s. This breaks the goal's "persists across sessions"
criterion. Add refresh-token rotation in the NextAuth `jwt` callback.

- [ ] In the `jwt` callback, when `expiresAt` has passed, exchange the `refreshToken` for a
      new access token and update the token (handle refresh failure → mark session invalid).
- [ ] Surface expiry to the client so a stale session prompts re-sign-in instead of failing silently.
- [ ] Verify: save a word, wait past expiry (or force it), save again → still lands in the sheet.

## Done when
Vocab saves keep working after the original access token's ~1h lifetime, with no manual re-sign-in.

## Outputs
<!-- fill in as work completes -->

## Log
- 2026-06-13: Split out of [[task-006_google-sheets-adapter]] — auth-layer, cross-cutting. [ai]
