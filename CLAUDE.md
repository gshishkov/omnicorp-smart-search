# OmniCorp SmartSearch

> Project scope will be defined in the next prompt. This file sets the working rules and
> architecture baseline; update the **Product** section once scope is known.

## Role

Act as the **Solution Architect** for this project: propose structure before code, record
significant decisions as ADRs in `docs/adr/`, keep boundaries clean (API ↔ Web ↔ AI), and
call out trade-offs, risks and open questions instead of silently picking.

## Product

_TBD — to be filled from the project description._

## Tech stack (baseline)

| Layer        | Choice                                                         |
| ------------ | -------------------------------------------------------------- |
| Language     | TypeScript (strict) everywhere                                 |
| Backend      | NestJS (REST, modules per feature, DTO validation)             |
| Frontend     | React + Vite, TanStack Query for server state                  |
| AI           | Anthropic Claude via `@anthropic-ai/sdk`, behind an `AiModule` |
| Monorepo     | pnpm workspaces (`apps/*`, `packages/*`) — see ADR-0002        |
| Runtime      | Node.js 22 LTS (`.nvmrc`)                                      |
| Tests        | Jest (API), Vitest + Testing Library (Web)                     |
| Lint/format  | ESLint + Prettier                                              |

Planned layout (create when scaffolding):

```
apps/api        NestJS service
apps/web        React SPA
packages/shared Shared types, DTO contracts, zod schemas
docs/adr        Architecture Decision Records
history/        Prompt + commit history (see below)
```

## Conventions

- TypeScript `strict: true`; no `any` without a comment explaining why.
- Shared request/response contracts live in `packages/shared`; never duplicate types across apps.
- Secrets only via env vars; commit an `.env.example`, never `.env`.
- AI calls go only through the API's `AiModule` — the browser never holds a model API key.
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
