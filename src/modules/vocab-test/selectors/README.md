# Session selectors

A **session selector** decides *what to test and in what order*: given all the user's
vocabulary, it builds the queue of cards for one quiz session.

It implements the `SessionSelector` port (`../ports/SessionSelector.ts`):

- `select(items, { size, now, dueAt })` → an ordered `QuizCard[]`.
- `dueAt` is supplied by the test mechanism, so the selector stays **generic over the SRS
  rules** — it never needs to know how intervals are calculated.

The default implementation is **`PrioritySessionSelector`**. It's swappable — any object
satisfying the port can replace it in `../service.ts` (e.g. a random or new-only strategy).

---

## PrioritySessionSelector — "most-overdue & weakest first"

It builds a session in a few stages:

1. **Pick candidates.** Keep only words that are **due now** (`now >= dueAt`). Never-reviewed
   words are due immediately, so they're always candidates; words scheduled for the future are
   excluded.

2. **Score each candidate.** A higher score means "show this sooner". The score combines:
   - **Weakness** — a per-stage weight (New/Learning/Known), weaker words weighted higher.
     The stage is derived from the interval via `../stage.ts`.
   - **Overdueness** — how far past due the word is (capped, so an ancient word can't dominate).
   - **A small random jitter** — breaks ties so equally-scored words (e.g. a fresh pile of New
     words, which all score alike) don't appear in the same order every session.

3. **Budget new words, adaptively.** A configurable share of the session is reserved for
   brand-new words so they aren't crowded out — *but* that share shrinks as the **due "Learning"
   backlog** grows, down to zero past a configurable backlog limit. The idea: when the user has
   lots of words mid-learning, focus on those before introducing new ones.

4. **Fill the rest with reviews, then backfill.** Remaining slots go to due reviews. If there
   still aren't enough (small deck), it backfills from any remaining candidates so the session
   isn't left short.

5. **Order and finalize.** Sort the chosen words by score, cap at the session size, and give
   each card a direction (Finnish→English or English→Finnish).

All the knobs — the new-word share, the per-stage weights, the overdue cap, the jitter, and the
learning-backlog limit — are tunable config in `PrioritySessionSelector.ts` (intentionally not
repeated here).

---

## Example

> Numbers below are **illustrative only** — not the real defaults. Assume: session size 5;
> up to 40% of a session may be new words; stage weights New = 3, Learning = 2, Known = 1;
> the new share reaches zero at 8 due Learning words.

**Scoring** — three due words, ranked by score (higher = shown first):

| Word | Stage | Overdue | Rough score |
|------|-------|---------|-------------|
| `koira` (dog) | New | due since forever | 3 + (overdue, capped) + jitter → highest |
| `talo` (house) | Learning | 2 days | 2 + overdue + jitter → middle |
| `kissa` (cat) | Known | just became due | 1 + ~0 + jitter → lowest |

So a New word and an overdue Learning word outrank a Known word that only just came due.

**Adaptive new budget** — same session size of 5:

- **6 Learning words due:** new share scales to `1 − 6/8 = 0.25` of its cap, so the usual
  "2 new" becomes `floor(2 × 0.25) = 0`. All 5 slots go to the Learning/Known reviews.
- **1 Learning word due:** new share is `1 − 1/8 ≈ 0.88` of the cap — roughly the full new
  allowance, so new words are included alongside the reviews.
