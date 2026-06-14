---
status: done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Build Google OAuth so the app can read and write the user's Google Sheet. Auth is a
prerequisite for the Sheets adapter — nothing in the persistence layer works without it.

## Steps

- [x] Set up a Google OAuth client (Cloud Console) — client ID + secret as env vars.
  - Go to console.cloud.google.com → APIs & Services → Credentials → Create credential → OAuth client ID
  - Application type: **Web application**
  - Authorised redirect URIs: add both `http://localhost:3000/api/auth/callback/google`
    and the container external port variant (e.g. `http://localhost:43697/api/auth/callback/google`)
  - Copy `.env.local.example` → `.env.local` and fill in `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
  - Generate `AUTH_SECRET` with `openssl rand -base64 32` and add it too
  - Set `AUTH_URL` to the URL you open in the browser (e.g. `http://localhost:43697` in the container)
  - Enable the **Google Sheets API** in APIs & Services → Library
- [x] Add NextAuth (or equivalent) to the Next.js API to handle the OAuth flow, token
      storage, and refresh. Scope: `spreadsheets` (fallback — Picker + `drive.file` deferred
      to the Sheets adapter task to avoid scope creep here).
- [x] Expose a server-side helper that returns a valid Sheets API client for the
      authenticated user — used by the adapter in the next task.
- [x] Add a sign-in / sign-out UI entry point (minimal — just enough to exercise the flow).
- [x] Verify end-to-end: sign in → token issued → Sheets API call succeeds (e.g. list
      sheets or read a test cell).

## Done when
A signed-in user has a valid Google OAuth session and server-side code can make an
authenticated Sheets API call on their behalf. No Sheets adapter yet — that's the next task.

## Outputs

- [src/lib/auth.ts](../../src/lib/auth.ts) — NextAuth v5 config: Google provider with
  `spreadsheets` scope, `offline` access, refresh token stored in JWT callback
- [src/types/next-auth.d.ts](../../src/types/next-auth.d.ts) — type augmentation for
  `Session.accessToken` and `JWT.accessToken / refreshToken / expiresAt`
- [src/app/api/auth/[...nextauth]/route.ts](../../src/app/api/auth/%5B...nextauth%5D/route.ts)
  — NextAuth route handler (GET + POST)
- [src/lib/googleSheetsClient.ts](../../src/lib/googleSheetsClient.ts) — `getSheetsClient()`
  server helper: reads session via `auth()`, returns an authenticated `sheets_v4.Sheets`
- [src/app/api/sheets/verify/route.ts](../../src/app/api/sheets/verify/route.ts) — creates a
  test spreadsheet to confirm auth + Sheets API work end-to-end (safe to delete the result)
- `src/components/AuthButton.tsx` — Server Component sign-in / sign-out button; uses Server
  Actions, no `SessionProvider` required (superseded in [[task-008_vocab-sheet-connect-ux]] by
  `TopBar` + `UserMenu`)
- [src/app/layout.tsx](../../src/app/layout.tsx) — `AuthButton` added to fixed top-right nav
  (later replaced by the sticky `TopBar` in task-008)
- [.env.local.example](../../.env.local.example) — documents `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` with setup instructions

## Log
- [ai] Installed `next-auth@beta` and `googleapis`. Built auth config, route handler, Sheets
  client helper, verification endpoint, and sign-in/out UI as Server Components (no
  `SessionProvider` needed). Build passes clean with no type errors.
- [human] Set up Google OAuth client in Cloud Console, filled `.env.local`, resolved
  container port mismatch by adding `AUTH_URL=http://localhost:43697`.
- [human] Verified: `/api/sheets/verify` returned `{ ok: true, spreadsheetId: "1x4uZ5pFXIr4ngiyJfj61nJmfP0xz62YZXdOhq2zTZZM" }`.
  Test sheet can be deleted from Google Drive.
