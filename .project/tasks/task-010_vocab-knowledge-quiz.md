---
status: done
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
- [x] **SRS algorithm & per-word state** — **interval-based**, recorded in
      [[004-srs-interval-schema]]. Store a `Review Interval` (days); next-review = `Last Tested`
      + interval; `Status` (New/Learning/Known) is **derived** (untested → New, below a known
      threshold → Learning, at/above → Known). Grades adjust the interval (Again resets short but
      stays Learning+; Hard/Good/Easy grow it). Tuning values → "Tuning suggestions" below.
      (Superseded the earlier 3-box Leitner idea after live testing showed it too coarse.)
- [x] **Sheet schema for knowledge** — per [[004-srs-interval-schema]]: keep `Status` +
      `Last Tested`, **add one app-owned `Review Interval`** column (extends [[003-vocab-sheet-design]]);
      still one tab, by header name, never overwrite user values. `Due` is **not** app state —
      optional user sheet formula (`= Last Tested + Review Interval`) for at-a-glance sorting.
- [x] **Word selection per session** — a separate, swappable **`SessionSelector`** port (so the
      strategy can change later). Default impl "most-overdue & weakest first": candidates = due
      + new; score = status weakness (New 3 / Learning 2 / Known 1) + overdueness; new-item ratio
      cap (~40%); session cap ~20; light shuffle within score tiers; per-card direction (fi↔en).
      All numbers are tunable config on the default selector. [human + ai]
- [x] **UI surface & entry point** — **dedicated `/test` route** reached via a "Test" link in
      the top bar [human]. Standalone (no Reader needed); deep-linkable.

### Tuning suggestions (starting points — set/adjust by testing, not fixed in [[004-srs-interval-schema]])
Note: `Review Interval` is stored in **seconds** (multiply day values by 86400). `Last Tested`
is a full ISO timestamp.
- First review interval by grade: Again 1 / Hard 2 / Good 3 / Easy 5 days (× 86400 s).
- Later reviews: Again → reset to the first-review value; Hard × 1.2; Good × 2; Easy × 3 (min +1 s).
- "Known" threshold: interval ≥ ~21 days (= 21 × 86400 s).
- Selector: status weakness New 3 / Learning 2 / Known 1; new-item ratio ~40%; session cap ~20.

### Sheet formulas (user-owned, per [[004-srs-interval-schema]] — also for the setup guide)
`Status` and `Due` are derived in the sheet, not written by the app. `Last Tested` is an ISO
**timestamp**; `Review Interval` is in **seconds**. Columns assume the user's layout
(`Finnish`=A, `Status`=C, `Last Tested`=G, `Review Interval`=H) — swap to match. Threshold
`21*86400` s (= 21 days) = "Known" cutoff, tunable.

`Status` — clear the old values, put in the first data cell (C2):
```
=ARRAYFORMULA(IF(A2:A="","",IF(G2:G="","New",IF((H2:H<>"")*(H2:H>=21*86400),"Known","Learning"))))
```

`Due` (optional, sorting — parses the ISO timestamp, converts seconds→days; UTC):
```
=ARRAYFORMULA(IF((G2:G<>"")*(H2:H<>""),DATEVALUE(LEFT(G2:G,10))+TIMEVALUE(MID(G2:G,12,8))+H2:H/86400,""))
```

Logic: never tested (`Last Tested` empty) → New; tested, interval < threshold → Learning;
interval ≥ threshold → Known.

### Build
- [x] `src/modules/vocab-test/` scaffolding — two swappable ports (**`TestMechanism`**,
      **`SessionSelector`**), the priority selector, default service wiring, client.
- [x] Knowledge access: read words + read/write app-owned columns by header name (reuses the
      vocab-store header logic via exported `getOrProvisionHeaders`).
- [x] API route(s): `GET /api/quiz/session` (built by `SessionSelector`), `POST /api/quiz/result`
      (grade → `TestMechanism` → write). Client helpers in `vocab-test/client.ts`.
- [x] **Reworked to [[004-srs-interval-schema]]**: app-owned columns now `Last Tested` +
      `Review Interval` (`Status` dropped from app ownership — vocab-store stops writing it too);
      `IntervalMechanism` replaces Leitner (grades adjust the interval); `Status` stage derived in
      code (`stage.ts`) for selection only; interval threaded through `KnowledgeItem` / result API
      / client. typecheck, lint, production build clean.
- [x] Quiz UI on `/test`: prompt (mixed fi↔en, with FI→EN / EN→FI tag) → reveal → grade
      (Again/Hard/Good/Easy), progress bar, end-of-session summary, + loading/no-sheet/
      unauthenticated/error/empty states. Keyboard: space reveals, 1–4 grade.
- [x] Top-bar "Test" link (+ "Read") via `NavLinks` with active state; `/test` is its own route.
- [x] Verify: take a quiz → `Last Tested` / `Review Interval` update in the sheet; due
      scheduling holds. Confirmed live by [human] 2026-06-14.

## Done when
A user can be quizzed on their vocabulary and each answer updates how well that word is known,
persisted in the Google Sheet (read → save → quiz → knowledge updated).

## Outputs
- [vocab-test module](../../src/modules/vocab-test/) — ports
  ([TestMechanism](../../src/modules/vocab-test/ports/TestMechanism.ts),
  [SessionSelector](../../src/modules/vocab-test/ports/SessionSelector.ts),
  [KnowledgeRepository](../../src/modules/vocab-test/ports/KnowledgeRepository.ts)),
  impls ([IntervalMechanism](../../src/modules/vocab-test/mechanisms/IntervalMechanism.ts),
  [PrioritySessionSelector](../../src/modules/vocab-test/selectors/PrioritySessionSelector.ts),
  [GoogleSheetsKnowledgeRepository](../../src/modules/vocab-test/adapters/GoogleSheetsKnowledgeRepository.ts)),
  stage derivation ([stage.ts](../../src/modules/vocab-test/stage.ts)),
  default wiring ([service.ts](../../src/modules/vocab-test/service.ts)), client
  ([client.ts](../../src/modules/vocab-test/client.ts)).
- API: [api/quiz/session/route.ts](../../src/app/api/quiz/session/route.ts) (GET) +
  [api/quiz/result/route.ts](../../src/app/api/quiz/result/route.ts) (POST).
- Reuse: exported `getOrProvisionHeaders` from
  [GoogleSheetsVocabRepository.ts](../../src/modules/vocab-store/adapters/GoogleSheetsVocabRepository.ts)
  so the sheet schema stays in one place.
- UI: [QuizSession.tsx](../../src/modules/vocab-test/components/QuizSession.tsx) (card flow +
  states) + [test/page.tsx](../../src/app/test/page.tsx) route;
  [NavLinks.tsx](../../src/components/NavLinks.tsx) added to
  [TopBar.tsx](../../src/components/TopBar.tsx) (Read / Test).

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
- 2026-06-14: Built the design-independent logic [ai]: `vocab-test` module (both ports + Leitner
  + priority selector + Sheets knowledge repo + default service wiring + client), and the two
  quiz API routes. Reused vocab-store's header logic via exported `getOrProvisionHeaders`.
  typecheck, lint, production build all clean (both `/api/quiz/*` routes present). UI pass next,
  waiting on the [human]'s quiz-UI design (per [[plan-before-ui-changes]]): `/test` page +
  top-bar "Test" link.
- 2026-06-14: Status model confirmed [human]: keep [[003-vocab-sheet-design]]'s New/Learning/Known
  as the stored, user-facing status; grades (Again/Hard/Good/Easy) stay transient input, never
  stored. 3-box Leitner is enough for MVP. SM-2 (expanding intervals via added Ease/Interval/Due
  columns) is an *additive* upgrade behind the swappable `TestMechanism` if weekly-review
  coarseness bites — Status survives it as the display layer. Proceeding with the simple version.
- 2026-06-14: Building the UI pass directly (no separate mock this time) in the existing design
  language, for the [human] to refine — same as the toast first-pass.
- 2026-06-14: Built the UI [ai]: `/test` route + `QuizSession` (progress bar, direction-tagged
  card, reveal → 4 grade buttons, summary, and loading/no-sheet/unauthenticated/error/empty
  states; space-to-reveal + 1–4 keys). Added `NavLinks` (Read/Test, active-aware) to the top bar.
  typecheck, lint, production build all clean (`/test` present). Awaiting live [human] verification.
- 2026-06-14: Live test [human]: `Last Tested` updated but `Status` stayed `New`. Not a write
  bug — original mapping had Again→New AND Hard→stay, so grading mostly Again/Hard left `New`
  words unchanged. Reworked the Leitner grade mapping so Hard→Learning (any recall above Again
  progresses): Again→New, Hard→Learning, Good→promote-one, Easy→Known. typecheck + lint clean.
- 2026-06-14: [human] flagged the 3-box model as fundamentally too coarse (can't tell a
  repeatedly-failed word from a progressing one; `Again`→`New` is wrong since a failed word is
  still being learned). Worked through the design and decided **interval-based SRS** —
  [[004-srs-interval-schema]]: store `Review Interval`, derive `Status`, `Due` left as an
  optional user sheet formula (Option B; compared Due-vs-interval-vs-Last-Answer first). I'd
  started implementing then reverted at [human]'s request to finalize the decision first.
- 2026-06-14: Decision 004 accepted [human]; tuning values (interval days, multipliers, known
  threshold) removed from the decision and parked here as "Tuning suggestions" — to be set by
  testing. Next: rework the mechanism to 004.
- 2026-06-14: Refined 004 [human]: `Status` is a **user-owned sheet formula**, not app state —
  the app owns `Last Tested` + `Review Interval` only and writes neither `Status`. Recorded the
  Status/Due formulas (Sheet formulas section). 003 carries an "Amended by 004" note.
- 2026-06-14: **Implemented 004** [ai]: vocab-store drops `Status` from app-owned columns + stops
  writing it on save (provisions `Review Interval`); `IntervalMechanism` (grades adjust interval);
  `stage.ts` derives the stage in code for selection; knowledge repo reads/writes
  `Last Tested`+`Review Interval`; interval threaded through types/API/client; setup guide updated
  with the formulas. typecheck + lint + build clean.
- 2026-06-14: [human] tuning request — `Last Tested` now a full **ISO timestamp**; `Review Interval`
  now in **seconds** (field renamed `intervalDays`→`intervalSeconds` throughout; defaults via a
  `SECONDS_PER_DAY` constant; known threshold `DEFAULT_KNOWN_THRESHOLD_SECONDS`). Sheet formulas
  updated (Status threshold `21*86400`; Due parses the timestamp + converts s→days). Decision 004
  reworded (timestamp + seconds). typecheck + lint + build clean.
- 2026-06-14: Polish [ai]: loading spinner on the quiz; guarded the mount fetch so React Strict
  Mode (dev) no longer double-calls `/api/quiz/session`. `LeitnerMechanism` kept as an unused
  alternative (header comment flags it; conforms to the current interface) until the SRS is final.
- 2026-06-14: **Verified live & approved** [human] — quiz works end-to-end; ready to close.
  Moved to in-review for the [human] to flip to done.
