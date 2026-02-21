# Agent Knowledge Base — Finnish Learner

> This file is the **primary onboarding document** for any AI agent working on this repository.
> Read this before making any changes. It describes what the app is, why it exists, how it works, and what conventions to follow.

---

## Table of Contents

1. [Project Purpose & User Intent](#1-project-purpose--user-intent)
2. [Application Overview](#2-application-overview)
3. [Architecture](#3-architecture)
4. [Feature Reference](#4-feature-reference)
5. [File Map](#5-file-map)
6. [Data Flow](#6-data-flow)
7. [Content System](#7-content-system)
8. [Conventions & Patterns](#8-conventions--patterns)
9. [Known Decisions & Trade-offs](#9-known-decisions--trade-offs)
10. [Setup & Running](#10-setup--running) → README.md
11. [Session History](#11-session-history)

---

## 1. Project Purpose & User Intent

The developer (Mahee) is **learning Finnish** and built this app as a personal tool to actively read Finnish text with on-demand, contextual translations — without jumping to a separate dictionary. This way amount of additional translation tasks feel lower for user of the application and it helps to maintain user's interest in learning.

**Core intent:**
- Read authentic Finnish text (stories, dialogues, etc.) inside the app
- Translate individual words by hovering over them (tooltip popup)
- Translate selected phrases/sentences via a subtitle-style popup at the bottom of the screen
- Load pre-written Finnish content from a curated library OR paste in their own text
- Persist session state so the app restores exactly where they left off on refresh

**This is a personal learning tool, not a public SaaS product.** Simplicity and UX quality matter more than scalability. There is no backend server, database, or authentication.

The long-term vision implied by the codebase and content structure:
- Grow the library of Finnish reading material across difficulty levels (beginner → advanced)
- Potentially support more language pairs in the future (the translation layer is generic)
- Improve vocabulary retention — future work could include word tracking, flashcards, etc.

---

## 2. Application Overview

| Property | Value |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Translation APIs | Google Translate (unofficial `gtx` endpoint, primary) + MyMemory API (fallback) |
| State persistence | `localStorage` (no database) |
| Content format | Markdown files with YAML frontmatter |
| Deployment target | Local / personal use (`npm run dev`) |

The app has **two modes**:

1. **Input mode** — a textarea where users paste or type text, plus a "Select Content" button to pick from the library.
2. **Learning mode** — the submitted text is split into individual word tokens, each rendered as a `TranslatableWord` component.

---

## 3. Architecture

```
Browser (Next.js SSR + Client Components)
│
├── src/app/page.tsx              ← Root page, manages all state
│   ├── ContentSelector           ← Library browser (fetches /api/content)
│   ├── TranslatableWord[]        ← One per word token in learning mode
│   └── SelectionTranslationPopup ← Bottom popup for selected text
│
├── src/app/api/content/route.ts  ← Next.js API route, reads MD files from disk
│
└── public/content/finnish/*.md  ← Finnish reading content (Markdown + frontmatter)
```

**State lives entirely in `page.tsx`** — no Redux, no Zustand, no Context. Props are drilled down. This is intentional for simplicity.

**Persistence** uses `localStorage` keys:
- `finnish_learning_input_text` — the raw text (preserves whitespace exactly)
- `finnish_learning_view_state` — boolean: `true` = input mode, `false` = learning mode
- `finnish_learning_scroll_y` — last saved reading scroll position (only saved on actual translation)
- `finnish_learning_last_translated_range` — `{start,end}` token index range of the last translated word/phrase

---

## 4. Feature Reference

### 4.1 Translation Modes

Controlled by a `<select>` in the UI. Four options:

| Mode | Constant | Behaviour |
|---|---|---|
| Hover & Selection | `TRANSLATION_MODES.BOTH` | Both hover tooltip and selection popup active |
| Hover Only | `TRANSLATION_MODES.HOVER` | Only word hover tooltip |
| Selection Only | `TRANSLATION_MODES.SELECTION` | Only text-selection popup |
| Off | `TRANSLATION_MODES.OFF` | All translation disabled |

### 4.2 Hover Translation (`TranslatableWord`)

- Each non-whitespace word token is a `<TranslatableWord>` component.
- On `mouseEnter`, waits `TRANSLATION_DELAY_MS` (100ms) then calls `translateWord()`.
- Displays a floating tooltip; position (`top`/`bottom`) is computed based on viewport space.
- Translation result is **cached in component state** — re-hovering does not re-fetch.
- Touch devices: handled via `touchStart`/`touchEnd` events.
- Will NOT show hover tooltip if the user already has text selected (checked via `hasTextSelection()` in `textUtils.ts`).

### 4.3 Selection Translation (`SelectionTranslationPopup`)

- Listens to `selectionchange` events on the document.
- Debounces by `SELECTION_CONFIG.DEBOUNCE_DELAY` (300ms) before calling the API.
- Renders a **subtitle-style dark popup fixed at the bottom** of the viewport.
- Limits: min 3 characters, max 500 characters (`SELECTION_CONFIG`).
- Ignores selections originating inside the popup itself.
- Only active in **learning mode** (not in the textarea input mode).

### 4.4 Language Direction

- `sourceLang` and `targetLang` are both `'en' | 'fi'`.
- The "Swap" button swaps the two, clears text, and resets to input mode.
- Default: Finnish → English (`fi` → `en`).

### 4.5 Content Library

- Finnish reading passages stored as `.md` files in `public/content/finnish/`.
- Files have YAML frontmatter: `title`, `description`, `difficulty` (`beginner`|`intermediate`|`advanced`), `tags`.
- The `ContentSelector` component fetches the list from `/api/content`, then fetches the full text of a selected item from `/api/content?id=<filename-without-extension>`.
- The API route (`route.ts`) uses `gray-matter` to parse frontmatter; content is returned as the markdown body text.
- Content files are sorted by difficulty, then alphabetically.

Current content files:
- `aamu-puistossa.md` — beginner story, morning in a park
- `kesa-mokilla.md` — beginner/intermediate story, summer cabin
- `keskustelu-tutustuminen-vapaa-aika.md` — dialogue, introductions & free time
- `uusi-naapuri.md` — story, new neighbour

### 4.6 Text Tokenisation

Text is split with `/(\s+)/g` — whitespace tokens are rendered as plain `<span>` elements, non-whitespace as `<TranslatableWord>`. This preserves newlines and multiple spaces exactly.

### 4.7 Reading Resume & Last Translated Marker

- The reading view restores scroll position using `finnish_learning_scroll_y` (saved when an actual translation occurs).
- The last translated word/phrase is highlighted with a distinct background color using the stored token range.

---

## 5. File Map

```
/
├── agent.md                          ← YOU ARE HERE — agent knowledge base
├── .agent/                           ← Session logs for agents
│   ├── README.md                     ← How to use .agent/
│   ├── session-template.md           ← Template for new session logs
│   └── sessions/                     ← One file per agent session
│       └── session-001.md
├── prompts/
│   └── prompt.md                     ← Original design spec / requirements doc
├── public/content/finnish/           ← Markdown reading content
├── src/
│   ├── app/
│   │   ├── layout.tsx                ← Root layout, global font (Geist)
│   │   ├── page.tsx                  ← Main page — all app state lives here
│   │   ├── globals.css               ← Global styles + Tailwind base
│   │   └── api/content/route.ts      ← Content API (GET /api/content)
│   ├── components/
│   │   ├── TranslatableWord.tsx      ← Word token with hover translation tooltip
│   │   ├── ContentSelector.tsx       ← Content library browser UI
│   │   └── SelectionTranslationPopup.tsx ← Bottom popup for selected text
│   ├── config/
│   │   ├── constants.ts              ← TRANSLATION_MODES, delay, colours
│   │   └── selectionConfig.ts        ← Selection limits, popup dimensions/styles
│   └── utils/
│       ├── translator.ts             ← Translation API calls (Google + MyMemory)
│       ├── textStorage.ts            ← localStorage read/write helpers
│       ├── textUtils.ts              ← hasTextSelection() and other text helpers
│       └── contentLoader.ts          ← Server-side MD file reader (gray-matter)
```

---

## 6. Data Flow

### Hover translation

```
User hovers word
  → handleMouseEnter() in TranslatableWord
  → setTimeout(100ms)
  → translateWord(word, sourceLang, targetLang)         [translator.ts]
    → googleTranslateUnofficial(word, to, from)         [primary]
    → fallback: translateWordMyMemory(word, from, to)   [backup]
  → setTranslation(result)
  → updateTooltipPosition() → render tooltip
```

### Selection translation

```
User selects text
  → selectionchange event → debounce 300ms
  → translateWord(selectedText, sourceLang, targetLang)
  → setSelectedTranslation(result)
  → render SelectionTranslationPopup at bottom
```

### Content loading

```
User clicks "Select Content"
  → setShowContentSelector(true) → render ContentSelector
  → useEffect → GET /api/content → list of metadata
  → User clicks item → GET /api/content?id=<id>
  → onContentSelect(content) → setText(content) in page.tsx
  → handleSubmit() → setShowInput(false) → learning mode
```

---

## 7. Content System

Content files are auto-discovered from `public/content/finnish/*.md` — no code changes needed when adding new files. For the full how-to (file format, frontmatter example, naming), see [README.md → Adding Content](README.md#adding-content).

### Frontmatter Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Recommended | Falls back to filename if missing |
| `description` | string | Optional | Shown in ContentSelector UI |
| `difficulty` | enum | Recommended | Controls sort order: beginner → intermediate → advanced |
| `tags` | string[] | Optional | Shown as badges in ContentSelector |

---

## 8. Conventions & Patterns

- **All global config values go into `src/config/`** — never hardcode magic numbers in components.
- **All localStorage access goes through `src/utils/textStorage.ts`** — never call `localStorage` directly in components.
- **All translation calls go through `translateWord()` in `translator.ts`** — do not add direct fetch calls in components.
- **No server state / no DB** — keep it client-side + static files. This is a personal tool.
- **Whitespace is sacred** — the app intentionally preserves all spacing and newlines so the text layout matches the original content.
- **TypeScript strict mode is on** (`tsconfig.json`). All new code should be properly typed.
- **Tailwind for all styling** — no CSS modules, no styled-components. Use `globals.css` only for base resets or keyframe animations.
- **`'use client'`** is required on any component that uses browser APIs or React hooks. `contentLoader.ts` is server-only (uses `fs`).

---

## 9. Known Decisions & Trade-offs

| Decision | Reason |
|---|---|
| Use Google's unofficial `gtx` endpoint (not official API) | Free, no API key required for personal use |
| MyMemory as fallback | Google's endpoint can rate-limit; MyMemory provides resilience |
| Translation cached in component state only, not globally | Simple; vocabulary set per session is small enough |
| `localStorage` for persistence, not cookies or db | Personal tool with no backend |
| Content stored as static Markdown files | Easy to author, no CMS needed, git-friendly |
| All state in `page.tsx` (no Context/Redux) | App is small enough that prop drilling is fine |
| `gray-matter` for frontmatter parsing | Industry standard, lightweight |
| Split on `/(\s+)/g` | Preserves multi-space and newline formatting from source content |

---

## 10. Setup & Running

See [README.md](README.md) for install, dev, build, and lint commands.

---

## 11. Session History

Session logs are stored in `.agent/sessions/`. Each file records what was done, decisions made, and what to do next.

See [.agent/README.md](.agent/README.md) for the session log format.

| Session | Date | Summary |
|---|---|---|
| [session-001](.agent/sessions/session-001.md) | 2026-02-21 | Initial agent infrastructure setup — created `agent.md` and `.agent/` session log system |
| [session-002](.agent/sessions/session-002.md) | 2026-02-21 | Added reading resume and last-translated marker (persisted via localStorage) |
