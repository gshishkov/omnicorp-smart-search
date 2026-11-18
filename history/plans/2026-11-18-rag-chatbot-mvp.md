# Plan — OmniCorp SmartSearch: RAG chatbot MVP

## Context
Customer Success Managers need to ask questions about internal docs and get answers that are **strictly grounded** in those docs, with **validated citations** and a refusal when the docs don't cover the question. The repo has only scaffolding so far (CLAUDE.md, `.claude/` skills, history hooks, ADRs). The earlier baseline assumed Anthropic + pnpm `apps/*`. The user has now set **OpenAI**, a `backend/ frontend/ docs/` split, and Docker Compose, so the baseline docs get updated as well.

Decisions from the user: I write 5 sample KB articles. Default models are `gpt-4.1-mini` (chat) and `text-embedding-3-small` (embeddings), both behind swappable provider interfaces (`EmbeddingProvider`, `LlmProvider`).

## Repository layout
```
backend/            NestJS API (own package.json, Dockerfile, .env.example)
frontend/           React + Vite + Tailwind (own package.json, Dockerfile, nginx.conf, .env.example)
source/             Knowledge base .md articles (mounted read-only into backend)
docs/               architecture.md, api.md, rag-design.md, adr/
docker-compose.yml  backend + frontend
.env.example        root: compose-level vars (ports)
README.md           setup, run, test, API, troubleshooting
```
Each app has its own npm package, so each Docker build is self-contained. There is no shared package; API contracts are written down in `docs/api.md` and mirrored in `frontend/src/types/api.ts`.

## Backend (`backend/src/`)
| Module | Responsibility |
|---|---|
| `config/` | `@nestjs/config` + zod-validated env: `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL=gpt-4.1-mini`, `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`, `SOURCE_DIR`, `CHUNK_SIZE=800`, `CHUNK_OVERLAP=120`, `TOP_K=5`, `MIN_SIMILARITY=0.30`, `CORS_ORIGIN`, `PORT`. The app fails fast if config is invalid. |
| `documents/` | `DocumentLoaderService` (reads `*.md`, parses front-matter `title`, falls back to first `#` heading, then filename), `ChunkerService` (Markdown-aware: split on headings, then by size with overlap; keeps the heading path), `DocumentsService` (reload orchestration and a reload lock), `DocumentsController` |
| `embeddings/` | `EmbeddingProvider` interface + `EMBEDDING_PROVIDER` token; `OpenAiEmbeddingProvider` (batched) |
| `vector-store/` | `VectorStore` interface + `InMemoryVectorStore` (cosine similarity, `upsertAll`, `search(vec, k)`, `clear`, `getChunk(id)`) |
| `llm/` | `LlmProvider` interface + `OpenAiLlmProvider` (Structured Outputs JSON schema, temperature 0, timeout, retries); prompts in `llm/prompts/` |
| `chat/` | `ChatService` (RAG pipeline), `CitationValidator`, `ChatController` |
| `common/` | Global `HttpExceptionFilter` (uniform error body), request-id logging, OpenAI error mapping |
| `health/` | `GET /api/health` (status, documents/chunks loaded) |

**Identifiers (deterministic, never model-generated):**
- `sourceId` = slug of the filename (`sla-and-support-tiers`).
- `chunkId` = `${sourceId}#${index}` (e.g. `sla-and-support-tiers#3`).
- Every chunk stores `{chunkId, sourceId, documentTitle, headingPath, text, embedding}`.

**Chat pipeline (`ChatService.ask`):**
1. Validate the DTO (`question`: string, trimmed, 3–1000 chars). If the KB is empty, return 503 "Knowledge base not loaded".
2. Embed the question, then `search(topK)`. If the best score is below `MIN_SIMILARITY`, **refuse without calling the LLM**.
3. Send the LLM a system prompt with strict-grounding rules. Chunks go in delimited `<chunk id="...">` blocks that are marked as untrusted data. The response schema is `{answerable: boolean, answer: string, citedChunkIds: string[]}`.
4. `CitationValidator`: keep only cited IDs that are in **this request's retrieved set**, and drop any unknown or hallucinated ones (logged as a warning). If `answerable` is true but no valid citations remain, refuse. Inline `[chunkId]` markers that aren't valid are stripped from the answer.
5. Citations are built **from the store**, never from model text: `{sourceId, documentTitle, chunkId, textSnippet (≤300 chars)}`.
6. A refusal is `{answer: "I couldn't find this in the OmniCorp documentation…", citations: [], refused: true}`.

**Endpoints:**
- `POST /api/chat` takes `{question}` and returns `{answer, citations[], refused}`. Note: the response field is `citations` (fixing the typo in the example).
- `POST /api/documents/reload` returns `{status:"completed"|"failed", documentsLoaded, chunksCreated, durationMs, errors[]}`. It returns 409 if a reload is already running.
- `GET /api/documents` returns `[{sourceId, title, fileName, chunkCount, sizeBytes, loadedAt}]`.
- The KB is also loaded automatically on startup (`onApplicationBootstrap`). If loading fails, the app still starts, health reports the problem, and chat returns 503.

**Security:**
- Global `ValidationPipe({whitelist, forbidNonWhitelisted, transform})`.
- `helmet`, CORS restricted to `CORS_ORIGIN`, `@nestjs/throttler` on chat (e.g. 20/min), and a body size limit.
- The API key exists only in backend env, is never logged, and is never returned.
- OpenAI errors map to 502/503/429 with safe messages. Error body: `{statusCode, error, message, path, timestamp, requestId}`.

## Frontend (`frontend/src/`)
- Built with Vite + React 18 + TS strict, Tailwind, TanStack Query.
- `components/Header.tsx`: an inline SVG OmniCorp logo plus title.
- `features/chat/`: `ChatPage`, `MessageList`, `MessageBubble`, `CitationList` (cards with document title, chunkId badge, snippet, expandable), `ChatInput` (validation, Enter to send, disabled while pending), and `useChat` (a `useMutation` that keeps message history in local state).
- `features/documents/`: `DocumentsPanel` (a table from `GET /api/documents` plus a Reload button that shows the stats). It's a slide-over drawer on mobile and a sidebar on desktop.
- The UI shows loading, empty, refused, and error states explicitly. It's responsive from 360px to desktop.
- `lib/http.ts`: a typed fetch client that calls the relative `/api`. In dev, Vite proxies it; in Docker, nginx proxies it. So there's no API URL and no key in the browser bundle.

## Knowledge base (`source/`)
Five fictional OmniCorp articles with front-matter, 400–900 words each:
- `sla-and-support-tiers.md`
- `billing-and-refunds.md`
- `sso-setup-guide.md`
- `customer-onboarding-playbook.md`
- `data-retention-and-privacy.md`

## Tests (no network; providers replaced by fakes)
- **Backend unit (Jest):**
  - chunker: boundaries, overlap, heading path, ID determinism
  - in-memory store: cosine ranking, k
  - citation validator: hallucinated IDs dropped, answerable-without-citations becomes a refusal
  - chat service: below-threshold refusal skips the LLM; valid answer maps citations from the store
  - loader: title fallback
- **Backend e2e (supertest):** the app runs with a deterministic `FakeEmbeddingProvider` (bag-of-words hash vectors) and a `FakeLlmProvider`. Cases:
  - `/api/documents/reload` stats
  - `/api/documents` list
  - `/api/chat` valid answer and refusal
  - 400 on bad DTOs (empty, wrong type, extra fields)
- **Frontend (Vitest + Testing Library, fetch mocked):** answer and citations render; refusal state; error state; input validation; documents table and reload.
- **Optional live smoke test** (`npm run test:live`), skipped unless `OPENAI_API_KEY` is set.

## Docker
- `backend/Dockerfile`: multi-stage `node:22-alpine` (build, then prod deps only), non-root user, `HEALTHCHECK`.
- `frontend/Dockerfile`: multi-stage build, then `nginx:alpine` serves `dist` and proxies `/api` to `backend:3000`.
- `docker-compose.yml`:
  - backend uses `env_file: backend/.env` and mounts `./source:/app/source:ro`
  - frontend runs on `${FRONTEND_PORT:-8080}` and has `depends_on` backend (healthy)
- Env examples: `.env.example`, `backend/.env.example`, `frontend/.env.example`.
- Local Node is v16, so tests can also run through Docker (`docker compose run --rm backend npm test`). The README covers both that and nvm/Node 22.

## Documentation and repo config updates
- Write `README.md` (overview, quickstart, env vars, running tests, API examples with curl, adding documents, troubleshooting) and `docs/architecture.md` (mermaid component and sequence diagrams).
- Write `docs/api.md` and `docs/rag-design.md` (chunking, thresholds, grounding prompt, citation validation, known limitations).
- Add ADR-0003 (RAG design and citation validation). Revise ADR-0002 to the OpenAI provider, the backend/frontend/docs layout, and npm per app, and set it to Accepted.
- Update `CLAUDE.md` (stack, layout, commands) and the `.claude/skills/ai-integration`, `nestjs-feature`, and `react-feature` skills: OpenAI, folder paths, npm.
- Log the history entry in `history/prompts/`.

## Delivery order (commits as vertical slices)
1. Docs/config updates (ADRs, CLAUDE.md, skills)
2. Backend skeleton + config + documents/chunker + store + tests
3. Embedding/LLM providers + chat + citation validation + e2e tests
4. KB articles
5. Frontend + tests
6. Docker + env examples + README

## Verification
- Run `npm test` and `npm run test:e2e` in `backend/`, and `npm test` in `frontend/` (via Docker if Node 22 isn't installed). All must pass, along with `lint` and `typecheck`.
- `docker compose up --build`, then:
  - `curl -X POST localhost:8080/api/documents/reload`: 5 docs, N chunks
  - `GET /api/documents`: the table
  - `POST /api/chat` with an in-scope question: answer plus valid citations
  - an off-topic question ("What's the capital of France?"): refused
  - `{}`: 400
- Open `http://localhost:8080` in the browser pane: ask questions, check citations, check the mobile viewport (375px).
- Without a real `OPENAI_API_KEY`, the live chat check can't run; that gets reported honestly and the fake-provider e2e tests cover the logic.
