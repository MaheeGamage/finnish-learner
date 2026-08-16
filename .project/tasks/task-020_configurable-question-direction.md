---
status: done    # to-do | in-progress | in-review | done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description

- **Problem:** the FI→EN / EN→FI split was a hardcoded `0.5` in
  [PrioritySessionSelector.ts](../../src/modules/vocab-test/selectors/PrioritySessionSelector.ts).
  Recognising a word and producing it are different skills, so the mix is a real preference.
- **Approach:** `recognitionRatio` joins the existing `TuningConfig`, so it rides
  [[task-018_unified-settings-management]]'s `SRS_TUNING` entry and the `x-srs-tuning` header —
  no new config entry, storage key, header or panel.
- **Constraints:** stored configs predate the field, so absent → default; present but outside 0–1 →
  rejected. Not part of preset identity — presets are spacing timelines, the direction mix is not.

## Done when

The Settings page sets the FI→EN share, it survives a reload, and the next quiz's cards follow it.

## Outputs

- [settings.ts](../../src/modules/vocab-test/settings.ts) — `recognitionRatio` on `TuningConfig`,
  `DEFAULT_RECOGNITION_RATIO`, validation in `parseTuning`, excluded from `profileOf`.
- [PrioritySessionSelector.ts](../../src/modules/vocab-test/selectors/PrioritySessionSelector.ts) —
  `randomDirection(recognitionRatio)`; the `0.5` is gone.
- [service.ts](../../src/modules/vocab-test/service.ts) — maps tuning → selector config.
- [SettingsPanel.tsx](../../src/modules/vocab-test/components/SettingsPanel.tsx) — "Question
  direction" card (percent input); preset switching preserves the ratio.
- [settings.test.ts](../../src/modules/vocab-test/settings.test.ts) — 4 units; 44/44 total.

## Log

- 2026-08-16: Built [ai]. Rode `TuningConfig` rather than adding a config entry: the value is
  consumed **server-side** by the selector, and tuning is the only validated client→server channel
  that exists — a separate entry would have needed its own header and route parsing. Cost: it sits
  under "SRS tuning" though it isn't spacing. Two follow-on choices came from that — absence is
  tolerated in `parseTuning` (else every stored config would reset again, right after task-018's
  key change already reset them once), and `profileOf` ignores it so changing the mix doesn't flip
  the user to Custom.
- 2026-08-16: Renamed `fiToEnRatio` → `recognitionRatio` [human + ai]. Human asked for a
  language-agnostic name, and judged the storage-migration cost of renaming a persisted field
  negligible at the current user count — worth revisiting only once there's a real user base.
  `recognitionRatio` names the *skill* (recognition vs production) rather than the language pair,
  so it survives a second language; the `'fi-en'` / `'en-fi'` direction values and the Settings copy
  still name the languages, which is honest while Finnish is the only pair.
