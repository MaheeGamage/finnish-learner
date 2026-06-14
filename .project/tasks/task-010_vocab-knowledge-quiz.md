---
status: to-do
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Build the knowledge-testing part of [[002-build-v2-mvp]]: a custom in-app SRS quiz that pulls
words from the user's vocab sheet, tests them, and writes how well each word is known back to
the **same sheet** — behind a swappable test-mechanism interface, and usable standalone without
the Reader. Approach is fixed by [[002-testing-custom-quiz]] + [[constraints]]; this task settles
the *how* and builds it.

Design-first: resolve the open decisions, then build.

### Open decisions (resolve first — capture each in the Log / a decision record)
- [x] **Quiz format & grading** — **self-graded reveal** (Anki-style Again/Hard/Good/Easy).
      [human]
- [x] **Test direction** — **both / mixed** (fi→en and en→fi across a session). [human]
- [x] **SRS algorithm & per-word state** — **fit 003, no new columns** [human]. Leitner-style:
      `Status` (New→Learning→Known) is the box, `Last Tested` is the timing anchor. `Due` =
      `Last Tested` + interval(Status) (e.g. New ≈ now, Learning ≈ 2d, Known ≈ 7d — tunable).
      Grade moves the box: Again→New, Hard→stay, Good→promote one, Easy→promote. SM-2 stays a
      later upgrade behind the swappable mechanism.
- [x] **Sheet schema for knowledge** — **unchanged from [[003-vocab-sheet-design]]**: reuse
      `Status` + `Last Tested`, by header name, never overwrite user values without consent.
      No new columns, so 003 is not extended.
- [x] **Word selection per session** — a separate, swappable **`SessionSelector`** port (so the
      strategy can change later). Default impl "most-overdue & weakest first": candidates = due
      + new; score = status weakness (New 3 / Learning 2 / Known 1) + overdueness; new-item ratio
      cap (~40%); session cap ~20; light shuffle within score tiers; per-card direction (fi↔en).
      All numbers are tunable config on the default selector. [human + ai]
- [x] **UI surface & entry point** — **dedicated `/test` route** reached via a "Test" link in
      the top bar [human]. Standalone (no Reader needed); deep-linkable.

### Build
- [ ] `src/modules/vocab-test/` with two swappable ports: **`TestMechanism`** (Leitner impl —
      grade → next `Status` + `dueAt`) and **`SessionSelector`** (default "most-overdue & weakest
      first" impl, tunable config; selector stays generic via a `dueAt` fn from the mechanism).
- [ ] Knowledge access: read words + read/write `Status`/`Last Tested` by header name (reuse the
      vocab-store Google Sheets adapter; honor the never-overwrite-without-consent rule).
- [ ] API route(s): fetch the session queue (built by `SessionSelector`), record a graded result.
- [ ] Quiz UI on `/test`: prompt (mixed fi↔en) → reveal → grade (Again/Hard/Good/Easy), session
      progress, end-of-session summary. Empty/no-sheet state handled.
- [ ] Top-bar "Test" link/route; confirm it works with no Reader state present.
- [ ] Verify: take a quiz → `Status` / `Last Tested` update in the sheet; due scheduling holds.

## Done when
A user can be quizzed on their vocabulary and each answer updates how well that word is known,
persisted in the Google Sheet (read → save → quiz → knowledge updated).

## Outputs
<!-- fill in as work completes -->

## Log
- 2026-06-14: Drafted [human + ai]. Approach pre-set by [[002-testing-custom-quiz]] (custom SRS
  quiz, knowledge in the sheet, swappable mechanism) and [[constraints]] (standalone Vocab Test);
  this task lists the open *how* decisions + build steps. task-007 (token refresh) parked aside
  for now.
- 2026-06-14: Decided [human]: format = self-graded reveal (Again/Hard/Good/Easy); direction =
  both/mixed. UI entry point still open — exploring navigation options.
- 2026-06-14: Remaining decisions settled [human], after referencing [[003-vocab-sheet-design]]:
  SRS = Leitner using existing `Status` + `Last Tested` (no new columns, 003 unchanged); session
  = due-first + new, cap ~20; entry point = dedicated `/test` route + top-bar "Test" link
  (standalone). All *how* decisions resolved — ready to build. Logic-first/UI-after split TBD
  with [human] (per [[plan-before-ui-changes]]).
- 2026-06-14: Word selection made its own swappable `SessionSelector` port [human request] —
  separate from `TestMechanism` so the strategy can be changed later. Default = "most-overdue &
  weakest first" with tunable config (status weights, overdueness, new-item ratio, cap, shuffle).
