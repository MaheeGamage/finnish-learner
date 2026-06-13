<!-- Overview — the entry point. Read this first to orient.
     A DERIVED view of goals/ + tasks/, which are the source of truth. Hand-kept
     for now; a script may generate it later, but it must stay hand-maintainable
     (no tool required). Only "## Project" is authored — everything else mirrors
     the goal/task files and is regenerable; never trust it over those files. -->

## Project
An application that helps you learn a language by reading text — surfacing inline
translation and linguistic context as you read.

## Goals
<!-- Each active or drafting goal as a heading; achieved/superseded goals are
     historical and omitted. Under each goal, its open tasks with status inline
     (`in-review` = waiting on a human). Done tasks are excluded.

     Example:

     ### [[001-knowledge-search]] — active
     - [[survey-existing-tools]] — in-progress
     - [[draft-architecture]] — in-review
     - [[compare-frameworks]] — to-do

     ### [[002-future-goal]] — drafting
-->

<!-- 001-plan-version-2 — achieved 2026-06-12 (omitted per convention) -->

### [002-build-v2-mvp](goals/002-build-v2-mvp.md) — active
<!-- - [google-oauth-flow](tasks/task-005_google-oauth-flow.md) — done 2026-06-13 -->
- [google-sheets-adapter](tasks/task-006_google-sheets-adapter.md) — in-review
- [oauth-token-refresh](tasks/task-007_oauth-token-refresh.md) — to-do
- [vocab-sheet-connect-ux](tasks/task-008_vocab-sheet-connect-ux.md) — to-do
- [save-failure-notifications](tasks/task-009_save-failure-notifications.md) — to-do


## Output locations
<!-- Authored (not derived): a high-level map of where each KIND of output is
     saved for this project — not a list of individual files. The agent reads this
     to know where to save new outputs, and asks the human only when a kind isn't
     covered yet (proposing a sensible default), then records the answer here so it
     never asks again. Paths are relative to the project root (the parent of
     .project/).

     Example:
     - Code → project root
     - System design / diagrams → /docs/diagram
     - Research findings → /docs/research

     Per-file links to what was actually produced live in each task's `Outputs`
     section, not here. -->

- Code → project root
- Docs → /docs
- Decisions → [.project/decisions/](.project/decisions/)


## Notes

- Remove characters like . or ! or anything else that not a letter before sending a word for translation

<!-- ⏸ Development parked 2026-06-13. Resume at task-006 (in-progress; only the env save-toggle
     is left). Full handoff — run/test
     instructions, the token-expiry gotcha, and the queued follow-ups (007/008/009) — is in the
     "PARKED — resume here" note at the bottom of task-006's Log. -->
- ⏸ Parked 2026-06-13 — resume at [task-006](tasks/task-006_google-sheets-adapter.md) (see its "PARKED — resume here" note). Work is uncommitted on `feature/implement-v2`.

- Human need to review task 7,8,9 before starting - IIMPORTANT