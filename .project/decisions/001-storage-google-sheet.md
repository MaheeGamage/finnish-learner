---
status: accepted
date: 2026-06-12
superseded-by:
---

## Context
v2 needs to persist two things: the user's **vocabulary** (words they want to learn) and
their **knowledge** of each word (how well it's known, from testing). The product vision is
a *user-accessible* store the learner can open and edit directly, that fills both manually
and automatically (the Reader adds words on the user's behalf while reading), and that feeds
the core loop: read content → update knowledge → repeat. Content is sourced from anywhere
(user-provided, etc.); AI generation from the user's knowledge is one optional, supplementary
source — the app must work without it.

Forces at play:
- The store must be directly viewable/editable by the user (central to the vision).
- It must sync across devices.
- Knowledge must stay co-located with vocabulary so the app can use it (progress, and any
  content sourcing — including optional AI generation — that wants to read it).
- Minimise infrastructure to host/operate.

Alternatives considered:
- **Backend database (Postgres/Supabase/etc.)** — rejected. Best for querying and
  spaced-repetition at scale, but the user can't directly view/edit their words without a
  bespoke UI we'd have to build, and it adds hosting/ops. Loses the "user-accessible sheet"
  property that is core to the vision.
- **Local browser storage only** (as v1 uses) — rejected. Zero infra and offline-friendly,
  but tied to one device/browser, no cross-device sync, easily lost, and not a
  user-accessible sheet.

## Decision
Store both the **Vocabulary Store** and **User Vocab Knowledge** in a single
**user-accessible Google Sheet**. They remain distinct logical components but share one
sheet as their backing store.

## Consequences
- Forces a **minimal backend**: Google OAuth and the Sheets API can't run safely from the
  browser (they need a server-held client secret), so reads/writes go through server-side
  code. This extends the existing Next.js API ([[src/app/api/content/route.ts]]) rather than
  adding new infrastructure.
- **Credentials are light**: the only persistent app-side secret is a single, app-level
  **Google OAuth client secret** (an env var) — not per-user, and the same secret any
  "Sign in with Google" app needs. No Sheets API key is required (API keys are only for
  public data; private user sheets go through OAuth), and the user supplies no keys of their
  own. Login and sheet-access consent are requested in a **single** OAuth flow (no separate
  "share" step), and a session/auth library (e.g. NextAuth) stores and refreshes the per-user
  access/refresh tokens for us. A refresh token only needs persisting if we access the sheet
  outside an active user session.
- **Scope choice (sub-decision)**: prefer the narrow `drive.file` scope + Google Picker (app
  creates the sheet, or the user points at an existing one) over the broad `spreadsheets` /
  `drive` scopes, to avoid Google's app-verification security assessment. To be confirmed.
- Easier: the user owns and can directly edit their data; no database to host; cross-device
  sync for free; knowledge sits beside vocabulary, so anything that needs it (progress,
  optional AI content generation) can read it directly.
- Harder: the Sheets API has rate limits and is weak for complex queries/large scale;
  concurrency and per-user sheet provisioning need handling.
- Follow-up: standing constraint "vocabulary + knowledge stored in a user-accessible Google
  Sheet" recorded in [constraints.md](../constraints.md).
