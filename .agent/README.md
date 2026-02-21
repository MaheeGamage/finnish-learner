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

1. Copy `session-template.md` to `sessions/session-NNN.md` (increment the number).
2. Fill in the **Session Info** and **User Request** sections at the start.
3. Update `agent.md`'s session history table with a one-line summary once the session is done.
4. Fill in **Work Done**, **Decisions Made**, and **Open / Next Steps** before ending the session.

---

## Naming Convention

Files are named `session-NNN.md` with zero-padded three-digit numbers:
`session-001.md`, `session-002.md`, ..., `session-010.md`, etc.

---

## What Makes a Good Session Log

- **Specific** — list exact files changed, not just "updated the UI"
- **Reasoned** — record *why* a decision was made, not just what was done
- **Forward-looking** — leave clear notes on what is incomplete or what to tackle next
- **Honest about blockers** — if something was left unresolved, say so
