---
status: done    # to-do | in-progress | in-review | done
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
- [x] Spike Voikko `FSTOUTPUT` on sample words → the raw path gives clean base/stem/ending
      segmentation; gradation reconstructed by comparing base vs surface stem. (see Log)
- [x] Extend `MorphologyResult` with `derivation: Derivation | null` (`Derivation = { summary,
      steps[] }`); existing fields untouched, so graceful degradation is unchanged.
- [x] Build the derivation engine (`deriveInflection.ts`, pure): parse FST → base/stem/ending,
      name affixes from resolved feature labels, detect KPT gradation via a gradation-pair
      table. Unexplained consonant change or failed reconstruction → `null` (degrade).
- [x] Unit-test the engine (`deriveInflection.test.ts`, `node:test`) against real captured FST
      fixtures — 13 tests, covers kk→k / nk→ng / k→∅, plural, possessive, and degrade cases.

**Plan — visual phase (human designs, then AI wires):**
- [x] Human chose the presentation from a rendered mockup: **Variant B — stacked steps**
      (one row per step: form + rule), **always visible** (no expander — the tooltip is
      `pointer-events-none` / dismiss-on-mouseleave, so click-to-expand isn't viable without
      reworking the interaction model). Colour code: amber = KPT gradation, indigo = ending.
- [x] AI wired it into `TranslatableWord.tsx` reading from `derivation.steps`; degrades to the
      previous one-line summary when `derivation` is null.

## Done when

Hovering/tapping a common inflected Finnish word shows a compact derivation line that
expands to labeled steps (affixes + KPT gradation), e.g. `nukun → nukkua · kk→k + -n (1st sg)`.
When the engine can't build a confident derivation, the tooltip falls back to the current
base-form + summary display with no regression.

## Outputs

- [deriveInflection.ts](../../src/modules/morphology/adapters/deriveInflection.ts) — pure
  derivation engine (FST parse + KPT gradation + step assembly).
- [deriveInflection.test.ts](../../src/modules/morphology/adapters/deriveInflection.test.ts) —
  13 `node:test` unit tests over real captured FST fixtures.
- [MorphologyAnalyzer.ts](../../src/modules/morphology/ports/MorphologyAnalyzer.ts) — port
  extended with `Derivation` / `DerivationStep` + `MorphologyResult.derivation`.
- [FinnishMorphologyAnalyzer.ts](../../src/modules/morphology/adapters/FinnishMorphologyAnalyzer.ts)
  — wires resolved feature labels into the engine, populates `derivation`.
- `package.json` `test` script + `tsconfig` `allowImportingTsExtensions` (dependency-free
  Node-native TS test runner).
- [TranslatableWord.tsx](../../src/modules/reader/components/TranslatableWord.tsx) — tooltip
  renders the stacked-step derivation (Variant B), falling back to the one-line summary.

## Log
- 2026-07-03: **Visual phase wired** [ai]. Human picked Variant B (stacked steps, always
  visible) from a rendered mockup. `DerivationStep` refactored to `{ kind, marker, detail,
  result }` so the tooltip styles the gradation token (amber) vs ending (indigo) without
  string-parsing; 13 tests updated + passing, `tsc` + `eslint` clean. Dev server compiles and
  serves (HTTP 200, no font blocker). **Not yet visually confirmed in a browser** — hover
  rendering needs a real browser + Voikko WASM; left for the human to eyeball. Status →
  in-review (awaiting human's visual check + promotion).
- 2026-07-03: **Logic phase complete** [ai]. Engine built + wired + unit-tested (13 passing),
  `tsc --noEmit` clean. Verified end-to-end through real Voikko: `nukun → nukkua · kk→k + -n`,
  `kaupungissa → nk→ng + -ssa`, `luen → k→∅ + -n`, `taloissamme → -issamme (inessive pl +
  poss.)` all correct; consonant-stem `käden`/`juoksee` and nested-derivation words degrade
  gracefully. **Next: visual phase — human designs the tooltip presentation** (compact
  `base → surface` line + `[▸ steps]` expander); AI then wires it. No UI changed yet.
- 2026-07-03: Logic phase started [ai]. **FSTOUTPUT spike done** (ran voikko in Node with the
  bundled dict — no network needed). Result: `FSTOUTPUT` gives exactly the segmentation we need.
  For `nukun`: `[Lt][Xp]nukkua[X]nuku[Tt][Ap][P1][Ny][Ef]n` → base=`nukkua`, surface-stem=`nuku`
  (gradation already applied), ending=`n`. So **gradation = compare base's stem-boundary
  consonants vs the FST surface stem** (no guessing): `nukkua→nuku` kk→k, `kaupunki→kaupungi`
  nk→ng, `lukea→lue` k→∅. Feature meaning still comes from the existing SIJAMUOTO/PERSON/TENSE
  tables. Hard cases (consonant-stem `käsi→kä`+`den`, `juosta→juo`+`ksee`) surface cleanly as
  low-confidence. Engine designed pure (plain-object input) → unit-testable in Node via built-in
  `node:test` + native TS, no new deps.
- 2026-07-03: Drafted [human + ai]. Enhancement to shipped task-016. Established that Voikko
  gives final features only — no derivation trace — so the step story is reconstructed from
  base + surface + features (best-effort, graceful degrade). Human decided: compact +
  expandable presentation, skip inflection-type naming for now, degrade gracefully on low
  confidence. Split into logic phase (derivation engine, unit-tested) and visual phase (human
  designs tooltip). [ai]
