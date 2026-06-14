---
status: done
owner: both
goal: "[[001-plan-version-2]]"
---

## Description
Work out the components that make up v2 of the reading-based language learner —
what each piece is responsible for and how they connect — as the first step of
planning. This grounds the later, harder calls (backend yes/no, where vocabulary
lives, how progress is measured) in a concrete picture of the system.

Start from what v1 already has (single-word + phrase translation, base-form
lookup, WiktApi linguistic context) and extend toward the v2 scope (session
history, vocabulary store, progress measurement).

- [x] List the v1 components in play today (reader UI, translation, lemma lookup, WiktApi).
- [x] Identify the new v2 components implied by the scope (session history, vocabulary store, progress).
- [x] Define each component's responsibility in one line.
- [x] Sketch how they connect (data flow / dependencies).
- [x] Draft a Mermaid component diagram under /docs.
- [x] Flag the open questions each component raises (e.g. store → backend vs. Sheet) for follow-up.

Resolve the open questions raised by the diagram (planning, within this task):
- [x] Storage: Vocabulary Store + User Vocab Knowledge live in a **Google Sheet** (same sheet for both).
- [x] Backend: **yes** — a minimal backend is needed (Google OAuth + Sheets API), extending the existing Next.js API.
- [x] Testing: **custom quiz** (SRS, e.g. SM-2) behind a **modular/swappable interface**; knowledge stays in the sheet, so no Anki fragmentation.

## Done when
The v2 components are named with one-line responsibilities and a Mermaid
component diagram under /docs shows how they connect, with open questions flagged
for follow-up.

## Outputs
- [[docs/v2-components.md]] — plain Mermaid (LR) component diagram of v2; initial-release vs later components colour-coded, resolved decisions annotated.
- [[001-storage-google-sheet]] — decision: store vocabulary + knowledge in a user-accessible Google Sheet; minimal backend follows.
- [[002-testing-custom-quiz]] — decision: custom in-app SRS quiz behind a swappable interface; Anki rejected as primary.

## Log
- [ai] Created the task to kick off v2 planning with the component map, per the human's steer to "start with components of the app".
- [ai] Drafted a rough C4 Container diagram at docs/v2-components.md. Chose C4 Container altitude (over Component / plain flowchart) because the key open question is backend-vs-Sheet, which is a container-level concern. Awaiting human review.
- [human] Don't want C4 — want a plain component diagram (Reader, User, UserVocabKnowledge, VocabStorage, etc.), covering everything in v2 scope.
- [human] Vision: a user-accessible vocabulary sheet (e.g. Google Sheet) of words to learn, filled manually or by the Reader on the user's behalf while reading; then a test (maybe Anki) quizzes the user to measure knowledge. So VocabStorage = words to learn; UserVocabKnowledge = how well each word is known.
- [ai] Replaced docs/v2-components.md with a plain Mermaid flowchart per the above, plus component descriptions and open questions. Awaiting review.
- [human] Core target = the loop: read → track progress / update knowledge → AI-generate content from updated knowledge → repeat. For the initial release: Session History is likely unnecessary, Progress Measurement dropped for now. User Vocab Knowledge stays a separate component but is stored in the same sheet as the Vocabulary Store (shown by a link between them). Colour initial-release components one colour, later ones grey. Keep the file purely a diagram; embed the open questions in the diagram itself.
- [ai] Reworked docs/v2-components.md to diagram-only: added AI Content Generator to the core loop, greyed out Session History + Progress Measurement as later, dotted link knowledge↔vocab store (same sheet), open questions as note nodes, and a two-colour (initial vs later) class style. Later set flowchart LR, moved AI Content Generator to "later", and made grey boxes use black text for readability.
- [human] Resolve the open questions within this same task — no separate task.
- [ai] Updated docs/v2-components.md to reflect resolved decisions: Vocab Test relabelled "custom quiz · SRS · pluggable mechanism", open-question notes replaced with a green "decided: minimal backend" note (storage already shown in the Vocabulary Store label).
- [ai] Drafted decision records [[001-storage-google-sheet]] and [[002-testing-custom-quiz]] (status: proposed), relinked constraints to them, and moved the task to in-review for human sign-off.
- [human] AI content generation is supplementary, not core — the app must work without AI; content can come from anywhere, AI is just one source.
- [ai] Reframed accordingly: added a generic "Content (sourced from anywhere)" component feeding the Reader; AI Content Generator is now one optional (later) source into Content. De-emphasised AI in both decision records' rationale.
- [human/ai] Clarified the Google auth/credentials model: login + sheet-access consent are one OAuth flow; only one app-level OAuth client secret is stored (no Sheets API key, no per-user keys); an auth library handles token refresh. Captured in [[001-storage-google-sheet]], plus a `drive.file` + Picker scope sub-decision (to confirm).
- [decision] Storage = Google Sheet for both Vocabulary Store and User Vocab Knowledge (same sheet). Rationale: matches the vision of a user-accessible sheet (manual + auto word adding), syncs across devices, no DB to host. Trade-off accepted: forces a small backend (Google OAuth + Sheets API can't run from the browser) and is only OK for small-scale querying. Alternatives rejected: backend DB (user can't directly view/edit words; more infra), local-only (no cross-device sync; not user-accessible).
- [decision] Backend = yes, minimal. Direct consequence of the Google Sheet choice; extends the existing Next.js API ([[src/app/api/content/route.ts]]) rather than adding new infrastructure.
- [decision] Testing = custom in-app quiz with a simple SRS algorithm (e.g. SM-2), drop Anki. Rationale: knowledge must stay in the Google Sheet to feed the read→update→AI-generate loop; Anki owns its own state and is hard to read back (AnkiConnect/desktop, no AnkiWeb API, one-way .apkg), which would fragment the data. Constraint added by human: the test mechanism must be modular/swappable so other mechanisms (incl. Anki) can be plugged in later → see [[constraints]].
