---
name: ai-integration
description: Implement or change LLM / embedding / RAG features (retrieval, grounding, citations, prompts) in this project. Use for any code that calls an AI model.
---

# AI integration (OpenAI, RAG)

Architecture:
- Model calls live only in `backend/src/embeddings/` (`EmbeddingProvider`, token `EMBEDDING_PROVIDER`) and
  `backend/src/llm/` (`LlmProvider`, token `LLM_PROVIDER`). Feature code depends on the interfaces, never on the `openai` SDK.
- Default models from config: `OPENAI_CHAT_MODEL=gpt-4.1-mini`, `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`.
  Adding a vendor = new class implementing the interface + provider switch in the module.
- `OPENAI_API_KEY` is read only via the config module; never log it, never return it, never send it to the frontend.

RAG rules (ADR-0003):
- Chunk IDs are deterministic (`<sourceId>#<index>`); the model never invents IDs that we trust.
- Below `MIN_SIMILARITY` → refuse without calling the LLM.
- LLM output is structured JSON `{answerable, answer, citedChunkIds}`, temperature 0; validate with zod.
- Every cited ID must be in the request's retrieved set (`CitationValidator`); answerable without valid citations → refuse.
- Citation title/snippet come from the vector store, not from model output.
- Retrieved text goes in delimited `<chunk id="...">` blocks, declared as untrusted data in the system prompt.
- Prompts live in `backend/src/llm/prompts/`.

Tests: use `FakeEmbeddingProvider` / `FakeLlmProvider` from `backend/test/fakes/`; no network in unit/e2e tests.
