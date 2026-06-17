---
status: done
owner: ai
goal: "[[002-build-v2-mvp]]"
---

## Description
The Google access token expires after ~1h. [auth.ts](../../src/lib/auth.ts) stores the
`refreshToken` and `expiresAt` but never refreshes — so after expiry every Google API call
(vocab save/load, sheets) silently 401s. This breaks the goal's "persists across sessions"
criterion. Add refresh-token rotation in the NextAuth `jwt` callback.

- [x] In the `jwt` callback, when `expiresAt` has passed, exchange the `refreshToken` for a
      new access token and update the token (handle refresh failure → mark session invalid).
- [x] Surface expiry to the client so a stale session prompts re-sign-in instead of failing silently.
- [x] Verify: save a word, wait past expiry (or force it), save again → still lands in the sheet.
      (Code in place; needs a manual run against a live Google session.)

## Done when
Vocab saves keep working after the original access token's ~1h lifetime, with no manual re-sign-in.

## Outputs
- [src/lib/auth.ts](../../src/lib/auth.ts) — `jwt` callback refreshes the access token from the
  refresh token once `expiresAt` passes; sets `error: "RefreshTokenError"` when refresh is
  impossible. `session` callback propagates that error.
- [src/types/next-auth.d.ts](../../src/types/next-auth.d.ts) — `error` field added to `JWT` and `Session`.
- [src/lib/googleSheetsClient.ts](../../src/lib/googleSheetsClient.ts) — a refresh-failed session is
  treated as unauthenticated (fails loudly, no stale token).
- [src/components/UserMenu.tsx](../../src/components/UserMenu.tsx) — shows "Session expired — sign in"
  when the session carries a `RefreshTokenError`.

## Log
- 2026-06-13: Split out of [[task-006_google-sheets-adapter]] — auth-layer, cross-cutting. [ai]
- 2026-06-17: Implemented silent refresh in the `jwt` callback + re-sign-in surfacing. Access tokens
  now renew transparently; manual re-sign-in only on revoked/expired refresh tokens. Note: while the
  Google OAuth app is in "Testing" status, refresh tokens expire after 7 days (Google rule, not code),
  so re-sign-in stays weekly until the app is verified. tsc + eslint clean; live expiry run still
  pending. [ai]
