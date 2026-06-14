---
status: done
owner: both
goal: "[[002-build-v2-mvp]]"
---

## Description
Add dev container to this project so the development environment can be ran in container so i can allow ai agent to run any command freely.

## Done when
Setup VSCode dev-container for this project.

## Outputs
- [.devcontainer/devcontainer.json](../../.devcontainer/devcontainer.json) — VSCode dev
  container config: builds the Dockerfile, forwards port 3000, runs `npm install` on create,
  installs ESLint/Tailwind/Claude Code extensions, runs as the `node` user, and mounts a
  named volume at `/home/node/.claude` so Claude Code login persists across rebuilds.
- [.devcontainer/Dockerfile](../../.devcontainer/Dockerfile) — Node 22 LTS base image
  (`mcr.microsoft.com/devcontainers/typescript-node`) with the `@anthropic-ai/claude-code`
  CLI installed globally so the agent runs fully inside the container.

## Log
- [human] Decisions: bake the Claude Code CLI into the container (so the agent runs inside,
  isolated from the host) and pin Node 22 LTS.
- [ai] Built the image locally (`docker build`) and verified the toolchain: Node v22.16.0,
  git 2.49.0, and `claude` 2.1.177 on PATH for the non-root `node` user
  (`/usr/local/share/npm-global/bin/claude`). devcontainer.json validated as JSONC.
  Not yet exercised via VSCode "Reopen in Container" — that's the human's acceptance step.