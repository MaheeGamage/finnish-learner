# Setup Guide

How to configure the environment for Finnish Learner v2 — Google sign-in, the Google
Sheets vocabulary store, and the rest of the `.env.local` variables. Follow it once to
get a working local setup.

## Prerequisites

- Node.js 18+ and npm
- A Google account (the same one whose Google Sheet you'll save vocabulary to)
- The repo cloned and dependencies installed (`npm install`)

---

## 1. Create a Google Cloud project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project picker (top bar) → **New Project**, give it a name (e.g.
   `finnish-learner`), and create it.
3. Make sure the new project is selected before continuing.

## 2. Enable the Google Sheets API

1. Navigate to **APIs & Services → Library**.
2. Search for **Google Sheets API** and click **Enable**.

> The app reads and writes vocabulary rows via this API. Without it enabled, sign-in
> works but every save fails.

## 3. Configure the OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** user type (a personal Google account can't use Internal).
3. Fill in the required app name, support email, and developer contact email.
4. **Scopes** — you don't have to add them here; the app requests them at sign-in
   (`openid`, `email`, `profile`, and `.../auth/spreadsheets` — see
   [src/lib/auth.ts](../src/lib/auth.ts)).
5. **Test users** — while the app is in "Testing" status, add the Google account(s) you'll
   sign in with. Only listed test users can authenticate.

> The app uses the full `spreadsheets` scope, which Google treats as **sensitive**. That's
> fine for personal/testing use with test users; publishing to all users would require
> Google's app-verification review.

## 4. Create OAuth client credentials

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized redirect URIs** — add the NextAuth Google callback for the exact URL you
   open the app at:

   ```
   <AUTH_URL>/api/auth/callback/google
   ```

   For a plain local run that's:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

   ⚠️ **This must match `AUTH_URL` exactly** (scheme, host, and port). A mismatch is the
   #1 cause of `redirect_uri_mismatch` errors at sign-in. See the dev-container note below
   if your port isn't 3000.
4. Create, then copy the **Client ID** and **Client secret** — these become
   `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

## 5. Generate the NextAuth secret

`AUTH_SECRET` can be any random string. Generate one with:

```bash
openssl rand -base64 32
```

## 6. Fill in `.env.local`

Copy the example and replace the placeholders:

```bash
cp .env.local.example .env.local
```

| Variable | Required | What it is |
|----------|----------|------------|
| `AUTH_GOOGLE_ID` | ✅ | OAuth **Client ID** from step 4 |
| `AUTH_GOOGLE_SECRET` | ✅ | OAuth **Client secret** from step 4 |
| `AUTH_URL` | ✅ | The exact URL you open the app at. Must match the redirect URI's base. |
| `AUTH_SECRET` | ✅ | NextAuth session secret from step 5 |
| `NEXT_PUBLIC_VOCAB_SAVING_ENABLED` | optional | `false`/`0`/`no`/`off` disables saving new vocab rows (default on). Client-side gate. |
| `VOCAB_SAVING_ENABLED` | optional | Server-side override; falls back to `NEXT_PUBLIC_VOCAB_SAVING_ENABLED` if unset. |

The two saving flags let you read without writing to the sheet — see
[vocabSavingFlag.ts](../src/modules/vocab-store/vocabSavingFlag.ts).

## 7. Prepare your vocabulary Google Sheet

1. Create (or pick) a Google Sheet in the **same account** you'll sign in with.
2. In **row 1**, add the headers **`Finnish`** and **`Translation`** (a single tab).
3. The app adds the `Status` and `Last Tested` headers itself if they're missing — you
   don't need to. See [decision 003](../.project/decisions/003-vocab-sheet-design.md).
4. You'll paste the Sheet's URL or ID into the **"Vocab sheet"** field in the app's top
   nav after signing in (stored in your browser, sent as the `x-vocab-sheet-id` header).

---

## Run it

```bash
npm run dev
```

Open **`AUTH_URL`** in the browser (e.g. http://localhost:3000), sign in with a Google
test user, paste your Sheet into the "Vocab sheet" field, then save a word while reading —
a row should appear in the sheet.

### Quick auth check

With the dev server running and signed in, hit
[`/api/sheets/verify`](../src/app/api/sheets/verify/route.ts) — it creates a throwaway
test spreadsheet and returns its URL, confirming the Sheets API and your credentials work.
The test sheet is safe to delete from Google Drive.

---

## Dev container note

This repo ships a dev container ([.devcontainer/](../.devcontainer/)) that forwards the
Next.js port. VS Code may forward it to a host port other than 3000 (e.g. `43697`). When
it does:

- Open the app at the **forwarded** URL, not `localhost:3000` directly.
- Set `AUTH_URL` to that same forwarded URL, **and** add
  `<that URL>/api/auth/callback/google` to the Authorized redirect URIs in step 4.

Sign-in only works at the URL that matches `AUTH_URL` and the registered redirect URI.

## Known gotcha — token expiry (~1h)

The Google access token expires about an hour after sign-in and is **not yet refreshed**,
so saves start failing with a `401 invalid_token` (visible only in the server terminal —
saves are fire-and-forget). Recovery for now is a full **sign out → sign in**. The
permanent fix is tracked in
[task-007 oauth-token-refresh](../.project/tasks/task-007_oauth-token-refresh.md).

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `redirect_uri_mismatch` at sign-in | `AUTH_URL` ≠ the registered redirect URI (port/scheme/host). |
| `access_denied` / can't sign in | Your account isn't added as a **test user** (step 3). |
| Sign-in works but saves fail | Google Sheets API not enabled (step 2), or token expired (~1h). |
| Saves silently do nothing | `VOCAB_SAVING_ENABLED` / `NEXT_PUBLIC_VOCAB_SAVING_ENABLED` set to off. |
| `Not authenticated` from `/api/...` | No active session — sign in first. |
