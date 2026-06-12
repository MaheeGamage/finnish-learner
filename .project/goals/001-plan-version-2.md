---
status: active   # draft | active | achieved | superseded
---

## Goal
Plan version 2 of the reading-based language learner before any coding — decide what v2 actually needs and how the pieces fit. Carry over the existing v1 capabilities and work out the new ones, settling the open questions: is a backend really needed, is a Google Sheet a sensible store, and how is learning progress tracked.

In scope for v2 planning:
- Translation — single-word and phrase (carried from v1)
- Base-form (lemma) lookup — single-word translation only (carried from v1)
- Session history — record what was read per session
- Vocabulary store — persist the user's vocabulary (backend vs. Google Sheet vs. other — open)
- Progress measurement — some way to gauge learning progress

## Success criteria
- [ ] The v2 feature scope above is written down clearly (what each feature is, in/out).
- [ ] The open questions are answered with reasoning, not left vague:
      backend needed or not, where vocabulary is stored, how progress is measured.
- [ ] A component diagram (Mermaid, in markdown under /docs) shows the v2 components
      and how they connect.
- [ ] Each significant, hard-to-reverse choice (e.g. the storage approach) is captured
      as a [[decision]] record with its rationale.

## Context
This builds on v1, which already has single-word + phrase translation, base-form lookup
via single-word translation, and WiktApi-based linguistic context.

Out of scope: writing v2 application code. This goal is planning only — the output is a
plan + diagram + decisions, not an implementation.
