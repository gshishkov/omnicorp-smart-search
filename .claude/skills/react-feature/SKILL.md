---
name: react-feature
description: Add or change UI in the React app (frontend/) — components, pages, hooks, data fetching, tests. Use for any frontend work.
---

# React feature

Layout in `frontend/src/`:

```
features/<feature>/
  components/       # presentational, props-driven
  hooks/            # useXxx — data fetching (TanStack Query) and local logic
  api.ts            # typed fetchers using src/types/api.ts
  <Feature>Page.tsx
components/ui/      # shared primitives
lib/                # http client, utils
```

Rules:
- Function components + hooks only; TypeScript props interfaces, no `React.FC`.
- Server state via TanStack Query (`useQuery`/`useMutation`) — no hand-rolled fetch-in-useEffect.
- Types for API payloads come from `frontend/src/types/api.ts` (mirrors `docs/api.md`); never redefine them.
- Handle loading, empty, and error states explicitly in every data view.
- Streaming AI responses: consume SSE/fetch streams in a hook; render incrementally; allow cancel (AbortController).
- Accessibility: semantic elements, labels on inputs, keyboard reachable controls.
- Env: only `VITE_`-prefixed public values; no secrets in the web app.
- Tests: Vitest + Testing Library, test behavior (what the user sees), mock `fetch`.

Done = `cd frontend && npm run lint && npm run typecheck && npm test` pass.
