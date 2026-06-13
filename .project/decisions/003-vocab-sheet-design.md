---
status: accepted
date: 2026-06-13
superseded-by:
---

## Context
The Sheets adapter needs a concrete sheet structure before it can be built. Two questions
had to be settled: how many tabs, and what columns.

**Tab count** — two tabs (Vocabulary + Knowledge) were considered for separation of concerns,
but introduced a cross-tab linking problem (word-as-key breaks on edits; row numbers break
on inserts; an ID column is noise for the user). The benefit is architectural and already
provided by the port interfaces in code — the sheet layout doesn't need to mirror it.

**User freedom** — the user must be able to add, reorder, or hide columns without breaking
the app. Solved by reading and writing columns by header name, not by position. The app
ignores any column it doesn't recognise.

## Decision

**One tab.** The app reads and writes by column header name, not position, so the user
can freely add columns around the app-owned ones.

**App-owned columns** (required headers — must exist, must keep these names):

| Header | Owner | Notes |
|---|---|---|
| `Finnish` | user + app | The word to learn (source language) |
| `Translation` | user + app | Translation in target language |
| `Status` | app (user may override) | New / Learning / Known |
| `Last Tested` | app | ISO date of last quiz result |

**Status values**: `New`, `Learning`, `Known`. Defined as a named constant in code so
values can be extended or renamed without touching the adapter logic.

The user may add any other columns (`Notes`, `Word Type`, `Example`, etc.) freely — the
app never touches them.

## Consequences
- Easier: one tab, no cross-tab linking, user has full layout freedom, simpler adapter.
- Harder: the app must do a header-row lookup before reading/writing (find column index by
  name). This is a small overhead — cache the header map per request.
- Sheet provisioning: the app only ever creates or writes to its two owned columns
  (`Status`, `Last Tested`). It never creates `Finnish` or `Translation` — those are the
  user's responsibility. On connecting a sheet, the app checks for `Finnish` and
  `Translation`; if either is missing, the user is notified to add them and the app does
  nothing until they are present. `Status` and `Last Tested` columns are added by the app
  if absent, but any existing values in those columns are never overwritten without the
  user's explicit consent.
- Future: splitting into two tabs (if knowledge columns grow complex) is a data migration
  (merge → split rows) plus an adapter swap — the port interfaces stay unchanged.
