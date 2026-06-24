---
status: to-do    # to-do | in-progress | in-review | done
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

## Open questions
- [ ] **Approach:** total-Learning WIP cap · per-day new-card cap (needs an intro-date we don't
      store) · a combination?
- [ ] **Relationship to the existing `learningCapForNew` (due-based pressure):** complement it
      (two pressures — due-learning *and* total-learning) or replace it?
- [ ] **Throttle shape:** hard zero at the cap, or scale down smoothly like the current `pressure`
      term?
- [ ] **Cap value:** rough starting number (e.g. ~15–20 total Learning words)?
- [ ] **User-configurable?** Expose on the **/settings** page with the other SRS tuning
      ([[task-011_expose-srs-tuning-config]]), or keep it an internal `PriorityConfig` constant?
- [ ] **Scope of "in flight":** Learning only (New and Known excluded) — confirm.
- [ ] **Empty-session UX:** when total Learning ≥ cap and nothing is due, a quiz legitimately
      returns 0 cards ("come back later"). Is that the desired message, or do we want a softer
      "nothing due yet" state? (see [[task-013]] note on the empty-session path)
- [ ] **Decision record?** "WIP cap vs daily new-cap" is a real, hard-to-cheaply-reverse fork —
      graduate to a `decisions/` record once an approach is chosen?

## Done when
Rapid back-to-back quizzes can't keep introducing new words past the chosen cap; once the
Learning set is full, sessions stop adding new words and (when nothing is due) return empty
rather than padding with new ones.

## Log
- 2026-06-22: Drafted [human + ai]. Diagnosis captured: existing new-word throttle keys off *due*
  Learning words, so it doesn't fire during same-sitting back-to-back quizzes; leading fix is a
  total-Learning WIP cap. Left as open questions per [human] — to be worked later.
