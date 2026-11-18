# OmniCorp SmartSearch


## Role

Act as the **Solution Architect** for this project: propose structure before code, record
significant decisions as ADRs in `docs/adr/`, keep boundaries clean (API ↔ Web ↔ AI), and
call out trade-offs, risks and open questions instead of silently picking.

## Product

RAG chatbot for OmniCorp Customer Success Managers. It answers questions **strictly** from internal
knowledge-base articles (`source/*.md`), always shows validated citations, and refuses when the docs
don't contain the answer. Plan: `history/plans/2026-11-18-rag-chatbot-mvp.md`. Design: ADR-0003, `docs/rag-design.md`.

## Tech stack

| Layer       | Choice                                                                |
| ----------- | --------------------------------------------------------------------- |
| Language    | TypeScript (strict) everywhere                                        |
| Backend     | NestJS REST API, modules per feature, class-validator DTOs            |
| Frontend    | React + Vite, function components + hooks, TailwindCSS, TanStack Query |
| AI          | OpenAI (`gpt-4.1-mini`, `text-embedding-3-small`) behind provider interfaces |
| Storage     | In-memory vector store (MVP)                                          |
| Runtime     | Node.js 22 (`.nvmrc`), Docker Compose for local runs                  |
| Tests       | Jest + supertest (backend), Vitest + Testing Library (frontend)       |

Layout (ADR-0002):

```
backend/   NestJS API         (npm package, Dockerfile, .env.example)
frontend/  React SPA          (npm package, Dockerfile, nginx.conf)
source/    Knowledge base .md articles (mounted read-only into backend)
docs/      architecture.md, api.md, rag-design.md, adr/
history/   Prompt, plan and commit history
```

## Commands

```bash
docker compose up --build                         # run the app on http://localhost:8080
cd backend && npm test && npm run test:e2e        # backend tests
cd frontend && npm test                           # frontend tests
```
Local Node is v16 on this machine; use Node 22 (nvm) or run tests in Docker (see README).

## Conventions

- TypeScript `strict: true`; no `any` without a comment explaining why.
- API contract: `docs/api.md` is the source of truth; keep `frontend/src/types/api.ts` and backend DTOs in sync with it.
- Secrets only via env vars; commit an `.env.example`, never `.env`.
- AI calls go only through the backend `embeddings/` and `llm/` provider interfaces — the browser never holds a model API key.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Every feature ships with tests; run lint + typecheck + tests before declaring done.

## History log (mandatory)

- `history/prompts/YYYY-MM-DD.md` — every user prompt is appended automatically by the
  `UserPromptSubmit` hook (`.claude/hooks/log-prompt.sh`).
- **At the end of every turn that did work**, append a `**Work done:**` summary under the latest
  prompt entry in today's file (use the `history-log` skill).
- `history/COMMITS.md` — appended automatically by the git `post-commit` hook
  (`.githooks/post-commit`). Do not edit by hand.

## Setup

```bash
./scripts/setup-hooks.sh   # points git at .githooks (run once per clone)
```

## Skills & agents in this repo

- Skills (`.claude/skills/`): `history-log`, `adr`, `nestjs-feature`, `react-feature`, `ai-integration`
- Agents (`.claude/agents/`): `solution-architect`, `code-reviewer`
