# Test mechanisms

A **test mechanism** decides two things for a vocabulary word, given how the user graded it
(`Again` / `Hard` / `Good` / `Easy`):

1. **What to store** — the new scheduling state after the grade.
2. **When it's next due** — so the session selector knows whether to show it again.

It implements the `TestMechanism` port (`../ports/TestMechanism.ts`):

- `grade(item, grade, now)` → the new `ReviewState` to persist (`lastTested`, `intervalSeconds`).
- `dueAt(item, now)` → the `Date` the word becomes due again.

The default implementation is **`IntervalMechanism`**. It's swappable — any object satisfying
the port can replace it in `../service.ts` (e.g. `LeitnerMechanism`, kept as an alternative).

---

## IntervalMechanism — how it works

It's a lightweight spaced-repetition scheme (SM-2 "lite", without a per-word ease factor).

**Stored state (two columns in the user's sheet):**

- `Last Tested` — an ISO timestamp of the most recent review.
- `Review Interval` — how long to wait before the word is due again, in **seconds**.

**Next-due time is derived, not stored:**

```
dueAt = Last Tested + Review Interval
```

A word is "due" when `now >= dueAt`. A word that has never been reviewed (no `Last Tested` /
`Review Interval`) is treated as due immediately, so brand-new words always surface.

### Grading

- **First review** (the word has no interval yet): the interval is set to a per-grade
  starting value — shortest for `Again`, longest for `Easy`.
- **Later reviews**:
  - `Again` → the interval **resets** to its short value (you forgot it; see it again soon).
    The word is still considered "in progress", not brand-new.
  - `Hard` / `Good` / `Easy` → the interval **grows**, by multiplying the previous interval by
    a grade-dependent factor (larger for `Easy` than `Good` than `Hard`), with a guaranteed
    minimum increase so it always moves forward.

So repeated successful recalls make a word come back less and less often, while a lapse pulls
it back to a short interval. The exact starting values and multipliers are tunable config in
`IntervalMechanism.ts` (and intentionally not repeated here).

### What it does **not** do

It never writes the user-facing `Status` (New / Learning / Known). That stage is *derived* from
the interval — in code by `../stage.ts` for selection, and in the sheet by a user formula. See
[decision 004](../../../../.project/decisions/004-srs-interval-schema.md).

---

## Example

> The numbers below are **illustrative only** — not the real defaults. Assume, for this example:
> first-review `Good` = 180s, `Again` short interval = 60s, and `Good` multiplies the previous
> interval by 2 (with a minimum +1s).

Take the word **`koira` → dog**, reviewed at successive times:

| Step | Action | Interval before | Interval after | Next due |
|------|--------|-----------------|----------------|----------|
| 1 | (never reviewed) | — | — | now (immediately due) |
| 2 | grade **Good** | — (first review) | 180s | 3 min later |
| 3 | grade **Good** | 180s | `max(180+1, 180×2)` = 360s | 6 min later |
| 4 | grade **Good** | 360s | 720s | 12 min later |
| 5 | grade **Again** | 720s | reset → 60s | 1 min later |

After step 4 the interval has grown to 12 minutes; the lapse in step 5 snaps it back to 60s so
the word resurfaces quickly. As the interval keeps growing past the "known" threshold, the
derived `Status` would read it as `Known` (a New word becomes `Learning` the moment it's first
graded).
