# Constraints

<!-- The constraints and assumptions that bound the project RIGHT NOW — a living
     list, read at a glance. One line per entry; note its origin: `given` for
     something externally imposed, or a link to wherever it came from — a
     [[decision]], a [[goal]], a task, or anything else. When a constraint changes,
     move it to "Lifted / changed" rather than deleting it, so the history survives;
     if the change has a real "why", record that as a decision and link it. This
     file is mutable; the individual decisions it links to are not. -->

## Active
<!-- Example (origin can be `given`, or a link to a decision / goal / task / anything):
     - Ship by 2026-08 — given
     - No cloud services — from [[002-self-host]] (a decision)
     - Must work offline — from [[001-knowledge-search]] (the goal)
     - API limit 100 req/min — surfaced in [[survey-existing-tools]] (a task) -->
- Components must be independently operable — Reader works standalone; Vocab Store + Vocab Test work without the Reader — given
- Vocabulary + knowledge stored in a user-accessible Google Sheet — from [001-storage-google-sheet](decisions/001-storage-google-sheet.md) (a decision)
- Testing/knowledge-measurement mechanism must be modular — swappable between implementations (custom quiz first, Anki/other later) — from [002-testing-custom-quiz](decisions/002-testing-custom-quiz.md) (a decision)

## Lifted / changed
<!-- Constraints no longer in force: struck through, with what replaced them and the
     decision link. Omit this section while empty.
     Example:
     - ~~3-week timeline~~ → extended to 2026-08, see [[005-extend-deadline]] -->
