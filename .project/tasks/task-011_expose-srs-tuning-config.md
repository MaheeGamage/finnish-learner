---
status: done    # to-do | in-progress | in-review | done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Make the SRS tuning values user-editable from the app, and fix the bug where words never
reach **Known**. Today the interval/multiplier values are hardcoded
([IntervalMechanism](../../src/modules/vocab-test/mechanisms/IntervalMechanism.ts)) at
*minute*-scale while the Known threshold is *21 days*, so a word effectively never crosses it —
everything reads `Learning`. [[004-srs-interval-schema]] already declares these as tuning
parameters owned by the user; this task exposes them and retunes the defaults so Known is
reachable.

**Config home:** in-app **/settings** page, persisted to **localStorage** (per-device). Base
unit stays **seconds**; the UI shows friendly equivalents.

**Tunable parameters** (the four the user picked): first-review intervals per grade · growth
multipliers per grade · Known threshold · session size.

**Key constraint:** grading runs **server-side** (the quiz API routes), config lives
**client-side**. So the client must send config to the server on each quiz call; the mechanism /
selector / service already take config args, so this is threading it through (defaults preserved
so each module still runs standalone).

**Known-threshold sync:** the app's threshold and the sheet's user-owned `Status` formula are
separate. The /settings page shows the matching formula (threshold substituted) to paste into
the sheet — keeps them in sync without the app writing `Status` (per [[004-srs-interval-schema]]).

### Preset profiles (configurable; seconds is canonical)
Three named presets ship as starting points, plus a **Custom** profile. The user picks a preset
in /settings and may then fine-tune any field — editing any value switches the active profile to
**Custom** (the preset values are never mutated; "reset to preset" restores them). Custom is the
saved, user-defined config and is what persists in localStorage. Each preset scales the whole
timeline — all reach **Known** in ~5 correct `good` reviews, but at progressively shorter
real-world spacing (slower→faster learner). Session size 5 for all. **First review** values are
seconds; multipliers apply to later reviews (`again` resets).

**Standard** (default) — Known threshold **21 days** (`21*86400` = 1 814 400 s)
| Grade | First review | Multiplier |
|---|---|---|
| again | 1 min (60) | 0 (reset) |
| hard | 10 min (600) | 1.2 |
| good | 1 day (86 400) | 2.5 |
| easy | 4 days (345 600) | 3.5 |

**Brisk** — Known threshold **5 days** (`5*86400` = 432 000 s)
| Grade | First review | Multiplier |
|---|---|---|
| again | 1 min (60) | 0 (reset) |
| hard | 5 min (300) | 1.2 |
| good | 6 h (21 600) | 2.2 |
| easy | 1 day (86 400) | 3 |

**Rapid** — Known threshold **1 day** (`1*86400` = 86 400 s)
| Grade | First review | Multiplier |
|---|---|---|
| again | 30 s (30) | 0 (reset) |
| hard | 2 min (120) | 1.2 |
| good | 1 h (3 600) | 2 |
| easy | 6 h (21 600) | 2.5 |

### Suggested sheet `Status` formula per preset
Same formula, only the threshold (the `N*86400` term) changes. Columns assume the user's layout
(`Finnish`=A, `Status`=C, `Last Tested`=G, `Review Interval`=H) — paste in the first data cell
(C2) and clear old values. Picking a preset in /settings shows its matching line to copy:

- **Standard** (21 d):
  `=ARRAYFORMULA(IF(A2:A="","",IF(G2:G="","New",IF((H2:H<>"")*(H2:H>=21*86400),"Known","Learning"))))`
- **Brisk** (5 d):
  `=ARRAYFORMULA(IF(A2:A="","",IF(G2:G="","New",IF((H2:H<>"")*(H2:H>=5*86400),"Known","Learning"))))`
- **Rapid** (1 d):
  `=ARRAYFORMULA(IF(A2:A="","",IF(G2:G="","New",IF((H2:H<>"")*(H2:H>=1*86400),"Known","Learning"))))`

### Build — Phase A (logic/plumbing, no visual design) — done
- [x] `vocab-test/settings.ts`: config schema + the 3 named presets (Standard default) + a
      Custom profile (`profileOf` → 'custom' when hand-tuned) + localStorage read/write/validate.
- [x] Thread config through `getQuizService(sheetId, tuning)` → mechanism + selector.
- [x] Quiz routes accept config via `x-srs-tuning` header, **validate server-side**
      (`parseTuningJson`), pass down; fall back to `DEFAULT_TUNING` when absent/invalid.
- [x] `client.ts` reads localStorage config (`loadTuning`) and sends the header on session +
      result calls.
- [x] Apply the retuned defaults (Standard) to `IntervalMechanism`; `stage.ts` threshold (21 d)
      already matches Standard.
- [x] typecheck + lint + production build clean (both `/api/quiz/*` routes present).

### Build — Phase B (UI) — done
- [x] `/settings` route ([page](../../src/app/settings/page.tsx) +
      [SettingsPanel](../../src/modules/vocab-test/components/SettingsPanel.tsx)) + top-bar
      "Settings" link (via `NavLinks`): preset picker (Standard/Brisk/Rapid + Custom indicator),
      editable cards for the four groups (seconds input + humanized read-back; any edit → Custom),
      reset-to-Standard, sticky save bar (unsaved/invalid state), and the copy-this-formula box
      (threshold matched to the active config).

### Docs
- [x] [setup-guide.md](../../docs/setup-guide.md) Status-formula note now points at the in-app
      Settings page.

## Done when
A user can edit the SRS tuning values (intervals, multipliers, Known threshold, session size)
from the app, those values drive the quiz, and with the retuned defaults a well-known word
reaches **Known** end-to-end (quiz → interval grows past threshold → Status shows Known).

## Outputs
- [settings.ts](../../src/modules/vocab-test/settings.ts) — `TuningConfig`, 3 presets + Custom,
  validation (`parseTuning`/`parseTuningJson`), `profileOf`, localStorage load/save/clear.
- [SettingsPanel.tsx](../../src/modules/vocab-test/components/SettingsPanel.tsx) +
  [settings/page.tsx](../../src/app/settings/page.tsx) — the `/settings` UI.
- Config plumbing: [service.ts](../../src/modules/vocab-test/service.ts) (tuning arg),
  [session](../../src/app/api/quiz/session/route.ts) + [result](../../src/app/api/quiz/result/route.ts)
  routes (`x-srs-tuning` header), [client.ts](../../src/modules/vocab-test/client.ts) (sends it),
  retuned [IntervalMechanism.ts](../../src/modules/vocab-test/mechanisms/IntervalMechanism.ts) default.
- [NavLinks.tsx](../../src/components/NavLinks.tsx) "Settings" link;
  [setup-guide.md](../../docs/setup-guide.md) note.

## Log
- 2026-06-18: Drafted [human + ai]. Config home = /settings + localStorage; tunables = the four
  params above; seconds stays canonical. Diagnosed the Known bug as minute-scale intervals vs a
  21-day threshold. Phasing logic→UI per [[plan-before-ui-changes]]; UI = dedicated /settings page
  [human]. Awaiting [human] approval to start Phase A.
- 2026-06-18: Added 2 lower-spacing presets (Brisk, Rapid) + a Custom profile [human]; recorded
  each preset's matching `Status` formula (only the `N*86400` threshold differs).
- 2026-06-18: **Phase A built** [ai]: `settings.ts` (TuningConfig + 3 presets + Custom +
  parse/validate + localStorage); `getQuizService(sheetId, tuning)` threads config into the
  mechanism + selector; both quiz routes read/validate the `x-srs-tuning` header (default
  fallback); `client.ts` sends the user's saved config. Retuned `IntervalMechanism` default to
  day-scale (Standard) so Known is reachable. typecheck + lint + build clean. Next: Phase B
  `/settings` UI — bringing a design to [human] before building (per [[plan-before-ui-changes]]).
- 2026-06-18: **Phase B built** [ai] — [human] asked to build the final UI directly (no mock
  first), will review live. `/settings` page + `SettingsPanel` (preset picker, four editable
  cards with seconds + humanized read-back, sticky save bar, copy-formula box) in the existing
  design language; "Settings" added to top-bar `NavLinks`; setup-guide note points at it. Output
  saved per device (localStorage). typecheck + lint + build clean (`/settings` route present).
  Static checks only — awaiting live [human] review/feedback.
- 2026-06-18: Fixed SSR hydration mismatch [human-reported] — `SettingsPanel` read localStorage
  in `useState` init (server rendered Standard, client rendered the saved profile). Now seeds
  `DEFAULT_TUNING` and loads the saved config in a post-mount `useEffect`. Otherwise [human]
  reports the UI is good.
- 2026-06-18: Mobile overflow fix [human-reported, post-done] — the seconds rows didn't wrap, so
  `label + input + "seconds" + "= 1 day"` overflowed narrow screens and scrolled the page (and top
  bar) sideways. Rows now `flex-wrap` with a narrower input and an unbreakable read-back; the save
  bar wraps too; card padding eased on mobile. typecheck + lint clean.
