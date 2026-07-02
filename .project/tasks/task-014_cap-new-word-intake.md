---
status: in-review    # to-do | in-progress | in-review | done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Stop back-to-back quizzes from over-introducing new words and burying the user under a
self-inflicted review pile-up.

**Problem.** A word just graded gets a future due time, so it's filtered out of the next quiz;
new words are always due (`dueAt` = epoch). So doing several quizzes in one sitting keeps pulling
in new words via the
[backfill](../../src/modules/vocab-test/selectors/PrioritySessionSelector.ts) until the New pile
runs out. Each enters Learning with a short first interval, so a day later the whole cohort comes
due at once and — under "weakest + most-overdue first" — dominates every session. Net effect: an
impatient sitting mortgages future focus (a known SRS anti-pattern; Anki's new-cards/day cap
exists for this).

**Why today's guard misses it.** `PrioritySessionSelector` already throttles new words via
`pressure = 1 - learningDue / learningCapForNew` (`learningCapForNew: 8`) — but `learningDue`
counts only **due** Learning words. In the back-to-back case the just-graded Learning words are
**not** due, so pressure ≈ 1 and new words flow in unthrottled. The safeguard keys off due
learning words; the over-introduction happens precisely when nothing is due.

**Leading idea (not decided).** A work-in-progress cap on the **total** Learning set (due or not):
zero/scale-down new-word intake once `count(deriveStage === 'Learning')` over all items exceeds a
cap. Needs no schema change — the selector already receives every item. Preferred over a true
per-day new-card cap because the sheet stores no introduction date (`lastTested` + interval only),
which makes a daily rate-limit awkward.

## Decisions (resolved 2026-07-02)
- **Approach:** total-Learning WIP cap. No schema change — the selector already receives every
  item. Per-day new-card cap rejected (sheet stores no introduction date).
- **Relationship to `learningCapForNew`:** complement, not replace. Two pressures — due-Learning
  *and* total-Learning WIP — combined via the stricter (smaller) wins: `pressure = min(due, wip)`.
- **Throttle shape:** smooth scale-down, mirroring the existing `pressure` term:
  `wipPressure = max(0, 1 - learningTotal / learningWipCap)`.
- **Cap value:** internal `PriorityConfig` constant `learningWipCap`, default **20**. Exposing it
  on **/settings** deferred to [[task-011_expose-srs-tuning-config]].
- **Scope of "in flight":** Learning only — `deriveStage === 'Learning'` excludes New and Known.
- **Empty-session UX:** the existing `empty` phase ("🎉 Nothing to review right now… check back
  later") covers it; no new message needed.
- **Decision record:** not graduated — the WIP-vs-daily fork was low-cost to reverse (one selector
  file, no schema/data change), so it stays in this Log rather than `decisions/`.

## Implementation
- [x] Add `learningWipCap: number` to `PriorityConfig` (default 20).
      → [PrioritySessionSelector.ts](../../src/modules/vocab-test/selectors/PrioritySessionSelector.ts)
- [x] Count total Learning over **all** items (due or not); derive `wipPressure`; combine with the
      existing due-based `duePressure` via `min`.
- [x] Add a `newCeiling` that the **backfill** respects — the real fix: previously the backfill
      re-padded an empty session with new words even when `newBudget` was 0. Now new backfill is
      capped at `floor(size * pressure)`, so a full Learning set yields an empty session, not a
      new-word pile-on. Reviews still backfill freely.
- [x] Verified via a fixture harness across 4 scenarios (clean slate → 5 new; WIP full → 0 cards;
      partial WIP → throttled; due backlog → reviews fill, 0 new). typecheck clean.

## Done when
Rapid back-to-back quizzes can't keep introducing new words past the chosen cap; once the
Learning set is full, sessions stop adding new words and (when nothing is due) return empty
rather than padding with new ones.

## Log
- 2026-06-22: Drafted [human + ai]. Diagnosis captured: existing new-word throttle keys off *due*
  Learning words, so it doesn't fire during same-sitting back-to-back quizzes; leading fix is a
  total-Learning WIP cap. Left as open questions per [human] — to be worked later.
- 2026-07-02: Open questions resolved [human]: total-Learning WIP cap, complement the existing
  due-based pressure (stricter wins), smooth scale-down, internal constant `learningWipCap`=20.
  Implemented in `PrioritySessionSelector` [ai]. Key finding while verifying: the WIP pressure
  alone was insufficient — the **backfill** re-padded an empty session with new words. Added a
  `newCeiling` the backfill honours; a full Learning set now yields an empty session (handled by
  the existing `empty` phase). Verified across 4 fixture scenarios; typecheck clean. → in-review.
