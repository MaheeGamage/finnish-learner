---
status: active
---

## Goal
Build and ship the v2 MVP — a working app where the user can read content, save vocabulary to their Google Sheet, and test their knowledge with an SRS quiz.

## Success criteria
- [ ] A user can authenticate and their saved vocabulary persists across sessions and devices.
- [ ] While reading, the user can select a word/phrase, see its translation and linguistic context, and save it to their vocabulary.
- [ ] The user can be quizzed on their vocabulary, and the result updates how well each word is known.
- [ ] End-to-end: read → save word → quiz → knowledge updated.
- [ ] Reader, Vocab Store, and Vocab Test each work on their own, without the others present.

## Context
Builds on the v2 plan: [002-plan](001-plan-version-2.md), diagram [docs/v2-components.md](../../docs/v2-components.md), decisions [001](../decisions/001-storage-google-sheet.md) [002](../decisions/002-testing-custom-quiz.md).

Out of scope for MVP: AI content generation, session history, progress measurement.
