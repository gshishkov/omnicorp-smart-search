# ADR-0003: RAG pipeline, grounding and citation validation

- **Status:** Accepted
- **Date:** 2026-11-18

## Context
CSMs must get answers strictly grounded in internal docs, with correct citations. LLMs can invent sources or IDs.

## Decision
- Markdown-aware chunking (split on headings, then by size with overlap). Deterministic IDs:
  `sourceId` = filename slug, `chunkId` = `<sourceId>#<index>`.
- In-memory vector store with cosine similarity. If the best match is below `MIN_SIMILARITY`, refuse **without** calling the LLM.
- The LLM returns structured JSON `{answerable, answer, citedChunkIds}` (OpenAI Structured Outputs, temperature 0).
- `CitationValidator` keeps only IDs that were in this request's retrieved set; unknown IDs are dropped and logged.
  If the model says it can answer but no valid citation remains, the response is a refusal.
- Citation payloads (title, snippet) are built from the store, never from model text.
- Retrieved text is passed in delimited blocks and declared untrusted in the system prompt (prompt-injection hygiene).

## Alternatives considered
- Free-text answers with regex-parsed citations: fragile, easy to hallucinate IDs.
- External vector DB (pgvector, Qdrant): unnecessary for 3–5 documents; the `VectorStore` interface allows a later swap.

## Consequences
Citations are always verifiable. Some valid answers may be refused when retrieval scores are low; the threshold is configurable.
The store is rebuilt on every start or reload (embedding cost scales with corpus size).
