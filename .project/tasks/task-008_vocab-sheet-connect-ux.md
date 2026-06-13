---
status: to-do
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Make connecting a vocabulary Google Sheet friendly and trustworthy. Today the sheet ID is
typed into a cramped field in the fixed top nav, with no confirmation the sheet is usable —
and on narrow screens the fixed nav overlaps the page title. This task redesigns that flow
and validates the sheet on connect.

- [ ] Redesign the connect/manage UI: move the sheet field out of the cramped nav into a
      clearer surface (settings/connect panel or modal) that shows the current connection state.
- [ ] Fix the mobile layout: the fixed top-right nav overlaps the centered title on small
      screens (see screenshots). Nav must not cover content on mobile.
- [ ] Validate on connect: when the user enters a sheet URL/ID, check it is reachable with
      their token and has the required `Finnish` / `Translation` headers; show a clear ✓
      connected state or an actionable error (e.g. "add a `Finnish` column"). Can repurpose
      the leftover [api/sheets/verify/route.ts](../../src/app/api/sheets/verify/route.ts).
- [ ] Verify: connect a valid sheet (✓), connect a sheet missing headers (clear error); the
      nav/title are usable on both mobile and desktop.

## Done when
A user can connect their sheet through a clear UI that confirms the sheet is valid (or explains
what to fix), and the top nav never overlaps page content on mobile.

## Outputs
<!-- fill in as work completes -->

## Log
- 2026-06-13: Split from [[task-006_google-sheets-adapter]] — covers UI concern #2 (friendlier
  sheet entry + mobile overlap) and #3 (validate the sheet on connect). [human + ai]
