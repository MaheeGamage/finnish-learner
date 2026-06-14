---
status: accepted
date: 2026-06-14
superseded-by:
---

## Context
The quiz first stored knowledge as just `Status` (New/Learning/Known) + `Last Tested`
([003-vocab-sheet-design](003-vocab-sheet-design.md)), with the SRS interval fixed per box.
In use this proved too coarse:
- `New` was being reset on failure (`Again`), but `New` should mean "never attempted" — a
  word you tried and failed is still being *learned*.
- Three status values are the only memory, so a word you keep failing and one you're acing
  look identical ("Learning, tested today") — the scheduler can't bring the failed one back
  sooner.

Keep New/Learning/Known as a helpful, readable signal, but make it a *projection* of finer
state rather than the state itself. Store the **interval** (the meaningful "strength"
quantity, robust to manual `Last Tested` edits which 003 encourages); a due date is derivable.
And rather than have the app own/write `Status`, derive it in the sheet — that removes the
app-vs-user override tension entirely (the user owns the `Status` formula).

## Decision
The app owns and writes only **`Last Tested`** (a full ISO **timestamp**) and a new
**`Review Interval`** (in **seconds**, for fine-grained tuning).
**`Status` becomes a user-owned, sheet-derived formula column** — the app never writes it.

- **Interval is the stored knowledge state.** Next-review time = `Last Tested + Review Interval`
  (derived; not stored as app state).
- **Grades adjust the interval**: `Again` resets it to a short interval; `Hard` / `Good` /
  `Easy` grow it by increasing amounts. (Concrete values are tuning parameters — see the task.)
- **`Status` is a sheet formula**, not app state: never tested → `New`; tested but interval
  below a "known" threshold → `Learning`; interval at/above it → `Known`. The app supplies a
  suggested formula (setup guide); the user can retune it.
- **The app derives the same stage internally** (from interval + `Last Tested`) for quiz
  selection weighting, so it does not depend on the user's `Status` column existing.
- **`Due` is likewise an optional user sheet formula** (`= Last Tested + Review Interval`) for
  at-a-glance sorting; not app state.
- Stays behind the swappable `TestMechanism`
  ([002-testing-custom-quiz](002-testing-custom-quiz.md)). Per-word ease (full SM-2) remains a
  future additive column if needed.

The concrete scheduling values — interval days, grade multipliers, the known threshold — are
**deliberately not fixed here**; they are tuning parameters started from suggestions in the
task and adjusted through use.

### Supersedes part of [003-vocab-sheet-design](003-vocab-sheet-design.md)
- App-owned columns are now `Finnish` · `Translation` · `Last Tested` · `Review Interval`.
  `Status` is **no longer app-owned** — it moves to a user-owned formula (003 had it as
  "app, user may override"). The app stops writing `Status` everywhere, including the reader's
  "save word" flow.
- Unchanged from 003: one tab, columns by header name, the app never overwrites a user's data
  in columns it doesn't own.

## Consequences
- Easier: proper spaced repetition (expanding intervals); failed words resurface sooner; no
  app/user fight over `Status` (the user fully owns its formula); `Due` also derivable by the
  user without app involvement.
- Harder: the user must set up the `Status` (and optional `Due`) formula once; the reader save
  + quiz code must stop writing `Status`.
- Migration: existing rows with no `Review Interval` are treated as a first review on their
  next grade. The app auto-provisions `Last Tested` / `Review Interval`; the user replaces the
  old `Status` values with the formula.
