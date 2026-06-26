---
status: done    # to-do | in-progress | in-review | done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description

Add YLE Selkouutiset (easy-Finnish news) as a live content source in the Reader —
so the user can pick a recent news episode directly from the Content Selector instead
of only reading static curated markdown files.

**Why this is a good fit.**
Selkouutiset is purpose-written in simplified Finnish (selkosuomi) — the same register
the app's curated content targets. Daily fresh real-world text is better practice than
re-reading the same stories, and it removes the manual work of copying articles.

### Data availability (already researched)

| Source | URL | What it gives |
|---|---|---|
| **Official RSS feed** | `https://yle.fi/rss/selkouutiset` | List of recent episodes (title, pubDate, link, image) |
| **Article page** | `https://yle.fi/a/74-XXXXXXXX` | Full easy-Finnish article text (server-side fetch) |

The RSS feed is **public, no API key required**, listed on [yle.fi/rss](https://yle.fi/rss).
Each RSS `<item>` is one daily broadcast episode; its `<link>` is the canonical article page
that contains the full plain-text news summary in simple Finnish.

**Article text structure** (observed from `yle.fi/selkouutiset`):
The article body is structured as an `<h2>` per news story followed by plain paragraph text —
clean enough to extract server-side and present verbatim in the Reader.

### Architecture decision — how to integrate

The content module already has a `ContentSource` port
([`src/modules/content/ports/ContentSource.ts`](../../src/modules/content/ports/ContentSource.ts))
with `list()` and `getById()`. A new `YleSelkoContentSource` adapter fits there exactly,
keeping the Reader unaware of the source.

**Fetching strategy:**
- `list()` → fetch and parse `https://yle.fi/rss/selkouutiset` server-side (Next.js API route or
  direct server-component fetch); return episode list as `ContentItem` metadata (no content yet).
- `getById(id)` → fetch the article page by URL, extract the readable text, return as `ContentItem`.

**No caching in MVP.** Each `list()` call re-fetches the RSS; each `getById()` re-fetches the
article page. This is fine for personal use — a session rarely selects the same article twice.
Caching can be added later (Next.js `fetch` cache tags or a simple in-memory map).

**Content cleaning:**
Strip HTML tags, navigation boilerplate, and repeated footer text from the article body.
Return only the editorial text (section headings + paragraphs). The `difficulty` field will
be set to `'intermediate'` (selkosuomi is simplified but still real-world Finnish); tags will be derived from
the episode title keywords.

**API route:**
Extend the existing `/api/content` route (or add a sub-route `/api/content/yle`) to
handle the Yle source. The `ContentSelector` UI can stay unchanged — it calls the same
API and renders whatever list it receives.

### Open questions — resolved
- [x] **Merge or separate lists?** → **Separate "Live news" section** below the local Library.
- [x] **How many episodes?** → **3 most recent** (`MAX_YLE_EPISODES = 3` constant, easy to change). [human]
- [x] **Content extraction approach?** → **Plain `fetch` + regex** — no new dependency.
- [x] **Error / unavailable state?** → **Fail silently** — YLE section hidden, library still works.

### Build plan
- [x] `src/modules/content/adapters/YleSelkoContentSource.ts` — implement `ContentSource`:
      `list()` fetches + parses the RSS XML, `getById(id)` fetches + strips the article page.
- [x] `/api/content` route — wire in `YleSelkoContentSource` (alongside or merged with local).
- [x] `ContentSelector` UI — separate "Library" + "Live news" sections; each loads independently.
- [x] Error handling — graceful degradation if YLE RSS or article fetch fails.
- [x] typecheck + production build clean.

## Done when
The user can open the Content Selector, see a list of recent Selkouutiset episodes, click one,
and read it in the Reader with full hover/selection translation — without any manual copy-paste.

## Outputs
- [YleSelkoContentSource.ts](../../src/modules/content/adapters/YleSelkoContentSource.ts) —
  `ContentSource` adapter: parses RSS, sorts newest-first, slices to `MAX_YLE_EPISODES` (3),
  extracts article text via regex. No new npm dependencies.
- [route.ts](../../src/app/api/content/route.ts) — extended to handle `?yle=list` and
  `?id=yle:<encoded-url>` alongside existing local-file routes.
- [ContentSelector.tsx](../../src/modules/reader/components/ContentSelector.tsx) —
  split into "Library" + "Live news" sections; YLE loads independently, fails silently.

## Log
- 2026-06-24: Drafted [human + ai]. RSS feed confirmed public (`https://yle.fi/rss/selkouutiset`).
  Architecture: new `YleSelkoContentSource` implementing the existing `ContentSource` port.
- 2026-06-24: Built end-to-end [ai]. Open questions resolved: separate section, 3 episodes
  newest-first [human], plain regex extraction, silent failure. typecheck + production build clean.
  Awaiting live [human] review.
