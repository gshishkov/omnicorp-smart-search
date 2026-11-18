# ADR-0002: Stack and repository layout

- **Status:** Accepted (revised 2026-11-18 after project scope was defined)
- **Date:** 2026-11-18

## Context
The product is a RAG chatbot for Customer Success Managers. The brief fixes: TypeScript, NestJS (REST, DTOs, modules),
React (function components + hooks, TailwindCSS), OpenAI API, in-memory vector storage, Docker Compose for local runs.
The brief asks for separated concerns: backend, frontend, documentation.

## Decision
- Top-level folders `backend/` (NestJS), `frontend/` (React + Vite + Tailwind), `docs/`, and `source/` (knowledge base).
- Each app is its own npm package with its own Dockerfile, so each image builds from its own context.
- No shared package: the API contract is documented in `docs/api.md` and mirrored in `frontend/src/types/api.ts`.
- Node.js 22 LTS. OpenAI behind `EmbeddingProvider` / `LlmProvider` interfaces so the vendor can change.

## Alternatives considered
- pnpm workspaces + `packages/shared`: removes type duplication but complicates per-app Docker builds; revisit when the contract grows.
- Next.js: SSR not needed for an internal chat tool.

## Consequences
Simple, independent builds. The API types must be kept in sync by hand (covered by e2e and frontend tests).
