# Dev container for the Finnish Learner Next.js app.
# Base image ships Node 22 LTS, npm, git, curl and a non-root `node` user.
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Install the Claude Code CLI globally so the AI agent can run inside the container.
RUN npm install -g @anthropic-ai/claude-code
