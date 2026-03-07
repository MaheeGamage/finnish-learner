# Session 004 — Vocab Tracking Design

## Session Info

| Field | Value |
|---|---|
| Session # | 004 |
| Date | 2026-03-07 |
| Agent | GitHub Copilot / Claude Sonnet 4.6 |
| Duration | ~30 min discussion, no code written |

---

## User Request

> Design and plan a vocabulary tracking feature that stores all words the user translates, lets them see which words they struggle with most, and allows focused practice — ultimately building a growing personal vocabulary list that can be exported to other tools.

---

## Context at Start of Session

- **Last session:** [session-003-mobile-touch-fix](./session-003.md)
- **State of app:** Working. Reading + hover/selection translation fully functional with scroll resume and last-translated marker.
- **Anything the user mentioned upfront:** No auth, no backend, keep it simple. Interested in GitHub Gist for sync across devices.

---

## Work Done

No code changes this session. This was a pure design discussion.

### Discussion Summary

#### localStorage robustness
- ~5MB limit per origin — not a concern for vocab (well under 1MB even with thousands of entries)
- Main risks: user clearing browser data, device-local only (no cross-device sync)
- Synchronous but imperceptible for small JSON blobs
- Atomic writes (full JSON.stringify + single setItem) prevent partial-write corruption

#### Sync options discussed
| Option | Verdict |
|---|---|
| Export/Import JSON | Simplest, zero infra, good starting point |
| GitHub Gist | Free, persistent, cross-device, PAT-based auth. Recommended for this use case |
| IndexedDB | Larger capacity, async, but still device-local — no sync benefit |
| Cloudflare Workers + KV | Lightweight real backend option |
| Supabase / PocketBase | Overkill for personal tool |

#### GitHub Gist specifics
- "Secret" gists are unlisted (not truly private, but fine for Finnish vocab data)
- ~10MB per file limit via API — no issue here
- 5,000 authenticated API requests/hour — irrelevant for a personal app
- PAT requires `gist` scope only — minimal risk even if extracted from localStorage

---

## Decisions Made

| Decision | Rationale |
|---|---|
| Use localStorage as primary store | Consistent with existing app pattern; no infra needed |
| GitHub Gist as optional sync layer | Free, cross-device, PAT-scoped to gist-only, acceptable security for personal tool |
| Export/Import as Phase 1 of sync | Immediate value, zero setup, works before Gist is configured |
| Separate `practiceCount`/`correctCount` from `lookupCount` | Passive reading signals vs active practice signals are distinct concepts |
| Third top-level app mode: **Vocab** | Keeps reading UI uncluttered; dashboard + practice live in own mode |

---

## Planned Architecture

### Data Model (`VocabEntry`)
```ts
type VocabEntry = {
  word: string;           // normalized lowercase source word
  translation: string;    // most recent translation
  sourceLang: string;
  targetLang: string;

  // Passive reading signals
  lookupCount: number;
  firstSeen: number;      // unix ms
  lastSeen: number;

  // Active practice signals
  practiceCount: number;
  correctCount: number;
  lastPracticed: number | null;
  nextReview: number | null;  // Leitner scheduling

  // Optional enrichment
  notes: string;
  tags: string[];
};

type VocabStore = Record<string, VocabEntry>; // keyed by normalized word
```

### Implementation Phases
| Phase | Scope | Files |
|---|---|---|
| 1 — Capture | Record every lookup silently into localStorage | `src/utils/vocabStorage.ts` (new); wire into `TranslatableWord.tsx` and `SelectionTranslationPopup.tsx` |
| 2 — Dashboard | View/sort/filter vocab, color-coded by struggle level, Export JSON + CSV/TSV, Import JSON, Gist sync settings | `src/components/VocabDashboard.tsx` (new); `src/app/page.tsx` (add Vocab tab) |
| 3 — Practice | Flashcard-style review with "Knew it" / "Didn't know", Leitner scheduling, practice queues (due today, weakest, recently seen) | `src/components/VocabPractice.tsx` (new) |
| 4 — Gist Sync | Auto pull on load, auto push after practice, merge strategy (higher count wins on conflict) | `src/utils/gistSync.ts` (new); settings panel in dashboard |

### Scheduling (Leitner-simplified)
- Knew it → interval doubles: 1d → 2d → 4d → 8d → 30d (capped)
- Didn't know → reset to 1d
- `nextReview` timestamp stored per entry; practice queues filter by `nextReview <= now`

### Export formats
- **JSON** — full `VocabStore` dump, tool-friendly
- **CSV/TSV** — `word, translation, lookupCount, correctCount, practiceCount` — Anki-importable

---

## Open / Next Steps

- [ ] Implement Phase 1: `vocabStorage.ts` + wire into translation components
- [ ] Implement Phase 2: `VocabDashboard.tsx` + Vocab mode tab in `page.tsx`
- [ ] Implement Phase 3: `VocabPractice.tsx` with Leitner scheduling
- [ ] Implement Phase 4: Gist sync utility + settings UI
- [ ] Update `AGENTS.md` session history table after implementation starts

---

## Notes for Next Agent

- User confirmed: no auth, no backend, no DB — all localStorage + optional Gist sync
- User wants words they look up most to be surfaced as "struggling" — `lookupCount` is the primary signal before practice data exists
- The reading UI should remain unchanged — vocab features live in a separate "Vocab" mode tab
- Follow existing patterns: all localStorage access through a dedicated util file; all config constants in `src/config/`
- For Gist sync: store PAT and Gist ID in localStorage; scope token to `gist` only; warn user in UI that PAT is stored client-side
