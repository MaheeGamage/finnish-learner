---
status: to-do
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Build Google OAuth so the app can read and write the user's Google Sheet. Auth is a
prerequisite for the Sheets adapter — nothing in the persistence layer works without it.

## Steps

- [ ] Set up a Google OAuth client (Cloud Console) — client ID + secret as env vars.
- [ ] Add NextAuth (or equivalent) to the Next.js API to handle the OAuth flow, token
      storage, and refresh. Scope: `drive.file` + Google Picker (preferred) to avoid
      app-verification; fall back to `spreadsheets` scope if Picker is impractical.
- [ ] Expose a server-side helper that returns a valid Sheets API client for the
      authenticated user — used by the adapter in the next task.
- [ ] Add a sign-in / sign-out UI entry point (minimal — just enough to exercise the flow).
- [ ] Verify end-to-end: sign in → token issued → Sheets API call succeeds (e.g. list
      sheets or read a test cell).

## Done when
A signed-in user has a valid Google OAuth session and server-side code can make an
authenticated Sheets API call on their behalf. No Sheets adapter yet — that's the next task.

## Outputs
<!-- fill in as work completes -->
