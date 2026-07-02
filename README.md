# Finnish Learner

A personal Finnish learning app — read Finnish text with interactive word-by-word and phrase translations, without leaving the page.

---

## Features

- **Hover translation** — hover over any word to see its translation in a tooltip
- **Selection translation** — select a word, phrase, or sentence to get a subtitle-style popup at the bottom of the screen
- **Content library** — pick from a curated set of Finnish reading texts (beginner → advanced)
- **Paste your own text** — or type anything directly into the input area
- **Four translation modes** — Hover & Selection / Hover Only / Selection Only / Off
- **Session persistence** — the app restores your text and mode on refresh

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

- `NEXT_PUBLIC_VOCAB_SAVING_ENABLED` (default: `true`) — build-time client flag; set `false`/`0`/`no`/`off` to read without writing new vocabulary rows (requires rebuilding when changed).
- `VOCAB_SAVING_ENABLED` (optional server override) — runtime server flag with the same values; useful to force-disable POST saves without relying on a client rebuild.

### Build for Production

```bash
npm run build
npm start
```

---

## How to Use

1. **Input mode** — paste Finnish text into the textarea, or click **"Select Content"** to browse the library
2. Click **"Start Learning"** to enter learning mode
3. Hover over individual words or select a phrase to see translations
4. Use the **translation mode selector** to control how translations are triggered
5. Click **"Clear Text"** to return to input mode

---

## Adding Content

Content files live in `public/content/finnish/`. Create a new `.md` file with YAML frontmatter:

```markdown
---
title: Story Title
description: One line description
difficulty: beginner | intermediate | advanced
tags: [tag1, tag2]
---

Finnish text here...
```

The filename (without `.md`) becomes the content ID. No code changes needed — the app auto-discovers all files in the directory.

---

## Project Structure

```
src/
  app/              - Next.js App Router (page, layout, API routes)
  components/       - React UI components
  config/           - App constants and configuration
  utils/            - Translation, storage, and content utilities
public/
  content/finnish/  - Finnish reading content (.md files)
```

---

## Third-party Libraries

### `@yongsk0066/voikko`

Finnish morphological analysis (base form + grammatical features shown in the hover tooltip) is powered by [`@yongsk0066/voikko`](https://github.com/yongsk0066/corevoikko) — a Rust rewrite of the authoritative [Voikko](https://voikko.puimula.org/) Finnish NLP library, compiled to WebAssembly. It runs entirely client-side with no server or native binary required, making it compatible with Vercel.

**License:** [MPL 1.1 / GPL 2+ / LGPL 2.1+](https://github.com/yongsk0066/corevoikko/blob/master/LICENSE) — the same tri-license as the upstream Voikko project.

---

> For agent/AI contributor documentation see [agent.md](agent.md) and [.agent/](.agent/).
