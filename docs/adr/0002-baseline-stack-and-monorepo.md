# ADR-0002: Baseline stack and monorepo layout

- **Status:** Proposed (confirm once product scope is known)
- **Date:** 2026-11-18

## Context
Stack is fixed by the brief: TypeScript, NestJS, React, AI integration. Backend and frontend share contracts.

## Decision
- pnpm workspaces monorepo: `apps/api` (NestJS), `apps/web` (React + Vite), `packages/shared` (types/zod schemas).
- Node.js 22 LTS.
- AI provider: Anthropic Claude through a single NestJS `AiModule` exposing a provider-agnostic `AiService` interface.

## Alternatives considered
- Nx / Turborepo: more tooling power, more overhead; can be added on top of pnpm workspaces later.
- Separate repos: simpler CI per app, but contract drift between API and Web.
- Next.js instead of Vite SPA: SSR not yet justified; revisit if SEO/SSR is required.

## Consequences
One install, shared types, atomic cross-app changes. Requires pnpm and Node 22 locally.
