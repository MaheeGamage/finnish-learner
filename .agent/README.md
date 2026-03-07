# .agent/ — Agent Session Logs

This directory stores a log of every AI agent session that has worked on this repository.

## Purpose

When a new agent starts working on this codebase, it should:
1. Read [`agent.md`](../agent.md) first (system overview, architecture, conventions, user intent)
2. Read the most recent session log in [`sessions/`](./sessions/) for current status
3. Create a new session log before starting work

This ensures continuity between sessions with minimal re-explanation from the developer.

---

## Directory Structure

```
.agent/
├── README.md              ← This file
├── session-template.md    ← Copy this to create a new session log
└── sessions/
    ├── session-001.md
    ├── session-002.md
    └── ...
```

---

## How to Start a New Session

1. Copy `session-template.md` to `sessions/session-NNN-topic-slug.md` (increment the number, add a short topic).
2. Fill in the **Session Info** and **User Request** sections at the start.
3. Update `agent.md`'s session history table with a one-line summary once the session is done.
4. Fill in **Work Done**, **Decisions Made**, and **Open / Next Steps** before ending the session.

**Important:** Use exactly one session file per conversation. If new work is requested in the same conversation, append updates to the existing `session-NNN.md` instead of creating a new session file.

---

## Naming Convention

Files are named `session-NNN-topic-slug.md` — zero-padded three-digit number followed by a short kebab-case description of the session's main topic:
`session-001-initial-setup.md`, `session-002-reading-resume.md`, `session-004-vocab-tracking-design.md`, etc.

Keep the topic slug short (2–4 words), lowercase, hyphen-separated. It should be scannable at a glance in a file listing.

---

## What Makes a Good Session Log

- **Specific** — list exact files changed, not just "updated the UI"
- **Reasoned** — record *why* a decision was made, not just what was done
- **Forward-looking** — leave clear notes on what is incomplete or what to tackle next
- **Honest about blockers** — if something was left unresolved, say so
