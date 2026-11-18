# Commit history

<!-- Appended automatically by .githooks/post-commit. Do not edit by hand. -->

## 2026-11-18 13:32 — `fb600f2` (main)

**chore: initial project scaffolding**  
Author: Geno Shishkov  
Changes: 22 files changed, 471 insertions(+)

> Add Claude Code config (CLAUDE.md, settings, prompt-logging hook,
> skills, agents), history folder with prompt and commit logs, git
> post-commit hook, base repo config and initial ADRs.

## 2026-11-18 15:05 — `04b357d` (main)

**feat: RAG chatbot MVP for Customer Success knowledge base**  
Author: Geno Shishkov  
Changes: 121 files changed, 19299 insertions(+), 74 deletions(-)

> - NestJS backend: document ingestion, Markdown-aware chunking, OpenAI
>   embeddings, in-memory vector store, grounded answers via structured
>   output, citation validation against retrieved chunks, refusals.
> - Endpoints: POST /api/chat, POST /api/documents/reload,
>   GET /api/documents, GET /api/health, Swagger at /api/docs.
> - React + Tailwind responsive chat UI with OmniCorp logo, numbered
>   citations, refusal/error states and documents panel.
> - Five sample knowledge-base articles in source/.
> - Dockerfiles, docker-compose, env examples, README and docs
>   (architecture, API, RAG design, ADR-0003).
> - Tests: backend unit + e2e with fake AI providers, frontend components.

## 2026-11-18 15:25 — `4af01b7` (main)

**feat: focused citation snippets, UI docs with screenshots**  
Author: Geno Shishkov  
Changes: 16 files changed, 360 insertions(+), 27 deletions(-)

> - Citation snippets are plain text (Markdown stripped, wrapped prose
>   re-joined) and centred on the sentence that best matches the answer
>   text carrying that citation, so the cited fact is visible.
> - README: "User interface" section with desktop and mobile screenshots.
> - Map OpenAI insufficient_quota / credit_balance_exhausted to a clear
>   "quota exhausted" message, distinct from rate limiting.
> - docker-compose: drop top-level `name:` (unsupported by Compose 2.0 beta).
> - docs/rag-design.md: snippet selection and its limitations.
