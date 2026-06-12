---
status: to-do
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Reorganize the repo from technical layers (`components/`, `utils/`, `types/`) into
component modules under `src/modules/<component>/`, each with a public API (index barrel)
and explicit interface contracts where modules talk to each other. Pure refactor — no
behaviour change. Net-new modules (e.g. Vocab Test) are deferred to their own tasks.

Target modules (from existing code): `reader`, `content`, `translation`, `wiktionary`,
`vocab-store`, `session-history`; plus `shared` for genuinely cross-cutting helpers.

- [ ] Map each existing file to a module.
- [ ] Create the module folders, each exposing a public API via `index.ts`.
- [ ] Define interface contracts at the boundaries (cross-module access goes through them).
- [ ] Move code and fix imports.
- [ ] Verify the app builds and behaves as before.

## Done when
Code lives in `src/modules/<component>/` modules, each with a public API and boundary
interfaces; cross-module access goes only through those; app builds and behaves unchanged.

## Human Comment

Double check this again