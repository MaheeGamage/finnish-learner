---
status: achieved   # draft | active | achieved | superseded
---

## Goal
Plan version 2 of the reading-based language learner before any coding — decide what v2 actually needs and how the pieces fit. Carry over the existing v1 capabilities and work out the new ones, settling the open questions: is a backend really needed, is a Google Sheet a sensible store, and how is learning progress tracked.

In scope for v2 planning:
- Translation — single-word and phrase (carried from v1)
- Base-form (lemma) lookup — single-word translation only (carried from v1)
- Session history — record what was read per session
- Vocabulary store — persist the user's vocabulary (backend vs. Google Sheet vs. other — open)
- Vocabulary knowledge testing — quiz the user on saved vocabulary to measure knowledge
- Progress measurement — some way to gauge learning progress

## Success criteria
- [x] The v2 feature scope above is written down clearly (what each feature is, in/out).
- [x] The open questions are answered with reasoning, not left vague:
      backend needed or not, where vocabulary is stored, how progress is measured.
- [x] A component diagram (Mermaid, in markdown under /docs) shows the v2 components
      and how they connect.
- [x] Each significant, hard-to-reverse choice (e.g. the storage approach) is captured
      as a [decision](../decisions/) record with its rationale.

## Context
This builds on v1, which already has single-word + phrase translation, base-form lookup
via single-word translation, and WiktApi-based linguistic context.

Out of scope: writing v2 application code. This goal is planning only — the output is a
plan + diagram + decisions, not an implementation.

## Outcome
Planning complete as of 2026-06-12. Key outcomes:

- **Component diagram** → [docs/v2-components.md](../../docs/v2-components.md)
  Initial-release components: User, Reader, Content (sourced from anywhere), Translation
  Service, WiktApi/Wiktionary, Vocabulary Store, User Vocab Knowledge, Vocab Test.
  Later (not initial release): AI Content Generator, Session History, Progress Measurement.

- **Storage** → [001-storage-google-sheet](../decisions/001-storage-google-sheet.md) (accepted)
  Vocabulary Store + User Vocab Knowledge in a single user-accessible Google Sheet.
  Minimal backend required (Google OAuth + Sheets API via existing Next.js API).
  One app-level OAuth client secret only — no per-user keys, no separate Sheets API key.

- **Knowledge testing** → [002-testing-custom-quiz](../decisions/002-testing-custom-quiz.md) (accepted)
  Custom in-app SRS quiz (e.g. SM-2) behind a modular, swappable interface.
  Results written to User Vocab Knowledge in the Google Sheet. Anki rejected as
  primary (data fragmentation), but kept as a future pluggable option.

- **Open sub-decision** (deferred to build phase): OAuth scope — `drive.file` + Google
  Picker (preferred, avoids app-verification) vs. broader `spreadsheets` scope.
