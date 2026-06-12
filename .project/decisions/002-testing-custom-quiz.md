---
status: accepted
date: 2026-06-12
superseded-by:
---

## Context
v2 measures the user's vocabulary knowledge by testing them, and that knowledge is read by
the rest of the app (progress, and optionally to inform content sourcing — AI generation
being one supplementary option). Per [001-storage-google-sheet](001-storage-google-sheet.md), knowledge is stored in the
user's Google Sheet alongside the vocabulary.

Forces at play:
- Knowledge must stay in the Google Sheet so the app can read it (for the read → update loop,
  and any content sourcing that wants to use it).
- The mechanism should support spaced repetition to be effective.
- The user wants the option to switch testing mechanisms later (not be locked in).

Alternatives considered:
- **Anki integration** — rejected as the primary mechanism. Anki has mature SRS, but it owns
  its *own* scheduling/knowledge state and is hard to read back: AnkiConnect requires the
  desktop app running, AnkiWeb has no official API, and `.apkg` export is one-way. This would
  fragment knowledge away from the Google Sheet and break the single-store model and the AI
  loop. (Anki remains valuable as a *future pluggable* mechanism — see below.)
- **No testing / decide later** — rejected. Knowledge measurement is part of the core loop,
  not a deferrable extra.

## Decision
Build a **custom in-app quiz** with a simple spaced-repetition algorithm (e.g. SM-2), writing
results to the **User Vocab Knowledge** in the Google Sheet.

Implement it behind a **modular, swappable interface** so the testing mechanism can be
replaced later (e.g. an Anki-backed implementation) without changing the rest of the system.

## Consequences
- Easier: knowledge stays in one place (the sheet); the AI loop reads it directly; full
  control over quiz UX and scheduling; no dependency on external Anki tooling.
- Harder: we own the SRS algorithm and quiz UI (more to build than reusing Anki); must design
  a clean test-mechanism abstraction up front to honour the swappability requirement.
- Follow-up: standing constraint "testing/knowledge-measurement mechanism must be modular —
  swappable between implementations" recorded in [[constraints]].
