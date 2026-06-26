---
status: done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description

When the user hovers or taps a word while reading, show the word's base form (lemma)
and a plain-English explanation of what grammatical change turned the base form into
the word on screen.

Example: hover `talossa` → tooltip shows `talo` (base) + `-ssa` (inessive: "in/inside").

**Why.** Finnish is heavily inflected — the same root word appears in dozens of forms.
Knowing the transformation helps the user recognise the same word across contexts and
builds intuition for Finnish grammar naturally while reading.

**Architecture decision (agreed).**
Decouple morphology from translation: Google Translate handles the meaning (existing),
a dedicated Finnish morphological analyser handles lemma + features. These are two
independent calls; if morphology fails, translation still shows.

**Chosen approach: `voikkojs` (WASM), Vercel-compatible.**
Voikko is the authoritative Finnish morphological analyser. `voikkojs` compiles it to
WebAssembly so it runs entirely client-side — no server, no native binaries, works on
Vercel. Fallback plan: switch to a public Finnish NLP REST API if initial load time
proves too slow in practice.

**Loading strategy.** Start initialising `voikkojs` in the background as soon as the
user enters reading mode (before any hover). By the time they hover the first word the
library is likely ready. Cache results in component state so the same word is only
analysed once per session.

**Tooltip UI constraint.** The morphology section must not push the tooltip off-screen on
any device. The existing tooltip already clamps left/right; the morphology content (taller
than the current single line) must also respect vertical bounds. Keep the tooltip compact —
one line per piece of information, no overflow on small phone screens.

**Language abstraction.** Morphology analysis must sit behind a language-agnostic
`MorphologyAnalyzer` port so that adding a second language later (e.g. Spanish, German)
means adding a new adapter only — no changes to the tooltip component or caller code.
The Finnish implementation wraps `@yongsk0066/voikko` + the SIJAMUOTO→English table.
`sourceLang` in the reader selects which adapter to use.

- [x] Verify `@yongsk0066/voikko` npm package: bundle size, API surface, maintenance status.
      → 4.3MB (189KB WASM + 3.8MB dict), zero deps, published 2026-02-24, Next.js example
      in docs. `analyze(word)` returns `BASEFORM`, `SIJAMUOTO`, `NUMBER`, `CLASS`, `TENSE`,
      `PERSON`, `MOOD`. Self-host dict + WASM in `/public` for Vercel (avoids CDN dependency).
- [x] Define `MorphologyAnalyzer` port: `analyse(word)` returns `MorphologyResult | null`
      with `baseForm`, `wordClass`, `formSummary`, `suffix`, `meaning` fields.
      → `src/modules/morphology/ports/MorphologyAnalyzer.ts`
- [x] Implement `FinnishMorphologyAnalyzer` adapter: wraps `@yongsk0066/voikko` (dynamic
      import), maps SIJAMUOTO / CLASS / TENSE / MOOD / PERSON / NUMBER / etc. to neutral shape.
      → `src/modules/morphology/adapters/FinnishMorphologyAnalyzer.ts`
- [x] Add Finnish knowledge table: SIJAMUOTO → { label, suffix, meaning } + CLASS / TENSE /
      MOOD / PERSON / COMPARISON / PARTICIPLE → English labels.
      → `src/modules/morphology/adapters/finnishKnowledge.ts`
- [x] Create `useMorphology(sourceLang)` hook: inits `FinnishMorphologyAnalyzer` in the
      background on mount, caches results in a ref (returns null before ready — graceful
      degradation), stable `analyse` callback to avoid re-renders.
      → `src/modules/morphology/hooks/useMorphology.ts`
- [x] Update `TranslatableWord` tooltip: morphology section below definition — shows
      `baseForm · suffix · formSummary — meaning` in indigo tones on a new compact line.
      Voikko is initialised in `TranslatableText` (one instance per reading session, not
      per word). typecheck clean.

## Done when

Hovering any common Finnish word shows the base form and a one-line explanation of the
grammatical change (e.g. `talo + -ssa → inessive: "in/inside"`). If morphology data is
unavailable the tooltip degrades gracefully to the existing translation-only display.

## Log
- 2026-06-26: Drafted [human + ai]. Feature intent agreed. Wiktionary ruled out as
  morphology source — coverage too low (~50% miss rate). Approach: voikkojs WASM,
  Vercel-compatible, background preload on reading-mode entry. REST API as fallback if
  load time is unacceptable. [ai]
- 2026-06-26: `@yongsk0066/voikko` verified — good fit. Two additional constraints added
  [human]: (1) tooltip must stay within viewport on mobile and desktop; (2) morphology
  must be behind a language-agnostic port so adding a second language later needs only a
  new adapter. Port named `MorphologyAnalyzer`; Finnish adapter wraps voikko. [ai]
- 2026-06-26: Built end-to-end [ai]. All checklist items complete; typecheck clean. Dev
  server cannot be verified locally because `layout.tsx` uses `next/font/google` which
  requires `fonts.gstatic.com` — blocked in the current dev container. **Blocker: rebuild
  dev container allowing that endpoint (or switch to `geist` npm package).** Feature code
  itself is not involved — the font issue is pre-existing and unrelated to this task. [ai]
