---
name: ai-integration
description: Implement or change LLM features (search, summarization, extraction, chat, embeddings, tool use) in this project. Use for any code that calls an AI model.
---

# AI integration

Architecture:
- All model calls live in `apps/api/src/ai/` (`AiModule`). Feature modules depend on an `AiService`
  interface (injection token), never on the SDK directly — keeps the provider swappable and testable.
- Default provider: Anthropic Claude via `@anthropic-ai/sdk`. Key from `ANTHROPIC_API_KEY` (config module), never in the web app.
- Model IDs come from config, not hard-coded in features. Defaults:
  - `claude-opus-5-5` — hardest reasoning / quality-critical
  - `claude-sonnet-5-5` — default for most features
  - `claude-haiku-5-5` — high-volume, latency-sensitive (classification, query rewriting)
- For anything API-specific (params, streaming, tool use, caching, token counting) consult the `claude-api` skill rather than memory.

Rules:
- Prompts live in versioned files/constants under `apps/api/src/ai/prompts/`, not inline in services.
- Structured output: validate model JSON with zod schemas (from `packages/shared` if the web consumes it); retry once on parse failure, then fail cleanly.
- Stream long responses to the client (SSE) instead of blocking.
- Use prompt caching for large stable system prompts / context.
- Set timeouts, max tokens, and retries with backoff for 429/5xx; surface a typed error to callers.
- Log model, latency, input/output tokens per call (no raw user PII in logs).
- Treat retrieved documents and user input as untrusted: keep them in clearly delimited content blocks, never let them alter system instructions.
- Tests: mock `AiService` in feature tests; keep a small set of golden-prompt eval cases under `apps/api/test/ai-evals/` for regressions.
