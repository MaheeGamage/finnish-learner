---
status: to-do    # to-do | in-progress | in-review | done
owner: both
goal: "[[002-build-v2-mvp]]"
---

# Human Comment
I'm not 100% sure what I want. So I will go with this task first and check the output and let you know whether this task will need any changes after the implementaiton

## Description

Extend the hover/tap tooltip beyond base-form + feature summary (shipped in
[[task-016_morphological-analysis-tooltip]]) to show **how the base word transformed into
the word on screen** — the affixes added and any KPT consonant gradation applied.

Example: `nukun` → base `nukkua`, then `drop -a → nukku-`, `+ -n (1st sg) → nukkun`,
`kk→k (KPT gradation) → nukun`. Compact form: `nukkua · kk→k + -n (1st sg)`.

**Why.** Seeing *which rule* changed the word (personal ending, case ending, consonant
gradation) builds grammatical intuition far faster than a bare feature list, and helps the
user recognise the same root across its many inflected forms.

**Key constraint discovered.** Voikko's `analyze()` returns only the *final features*
(BASEFORM, SIJAMUOTO, PERSON, TENSE, …) plus a raw `FSTOUTPUT`/`STRUCTURE`/`WORDBASES`.
It does **not** provide a ready-made derivation or flag KPT gradation. The step-by-step
story must be **reconstructed by us** from base form + surface form + features. This is
best-effort, not a guaranteed linguistic derivation.

**Decisions (agreed with human):**
- **Presentation:** compact one-line summary always visible; expands (tap/click) to the full
  step list. Must respect the existing mobile viewport clamp — no overflow on small screens.
- **Scope of first cut:** affixes (case / personal / tense / plural endings) + KPT consonant
  gradation. **Inflection-type naming (verb type 1–6, declension class) is out of scope for
  now** — Voikko doesn't provide it; revisit as a follow-up.
- **Uncertainty:** degrade gracefully — show reconstructed steps only when confident;
  otherwise fall back to the current base-form + summary display. Never show a story we
  aren't fairly sure of.
- **Language abstraction preserved:** the derivation lives behind the existing
  `MorphologyAnalyzer` port so a second language needs only a new adapter.

**Plan — logic phase (buildable + testable without any UI):**
- [ ] Spike Voikko `FSTOUTPUT` / `STRUCTURE` on sample words (`nukun`, `talossa`, `koirilla`,
      `tulen`) to judge whether the raw transducer path gives reliable morpheme segmentation.
      If cryptic, fall back to prefix-alignment of base ↔ surface.
- [ ] Extend `MorphologyResult` with an optional `derivation: DerivationStep[] | null`
      (existing `baseForm` / `formSummary` untouched, so graceful degradation is unchanged).
- [ ] Build the derivation engine: align base ↔ surface, name added affixes from features,
      detect KPT gradation via a gradation-pair table (`kk↔k`, `pp↔p`, `tt↔t`, `k↔∅`, `p↔v`,
      `t↔d`, `nk↔ng`, `mp↔mm`, `nt↔nn`, …). Emit ordered steps + a confidence flag; low
      confidence → `derivation: null`.
- [ ] Unit-test the engine against a fixture set of known words so accuracy is measurable and
      regressions are caught.

**Plan — visual phase (human designs, then AI wires):**
- [ ] Human specifies the tooltip presentation: compact `base → surface` line with a
      `[▸ steps]` expander, within the mobile viewport clamp.
- [ ] AI wires the specified markup to the engine's `derivation` output.

## Done when

Hovering/tapping a common inflected Finnish word shows a compact derivation line that
expands to labeled steps (affixes + KPT gradation), e.g. `nukun → nukkua · kk→k + -n (1st sg)`.
When the engine can't build a confident derivation, the tooltip falls back to the current
base-form + summary display with no regression.

## Log
- 2026-07-03: Drafted [human + ai]. Enhancement to shipped task-016. Established that Voikko
  gives final features only — no derivation trace — so the step story is reconstructed from
  base + surface + features (best-effort, graceful degrade). Human decided: compact +
  expandable presentation, skip inflection-type naming for now, degrade gracefully on low
  confidence. Split into logic phase (derivation engine, unit-tested) and visual phase (human
  designs tooltip). [ai]
