# RAG design: grounding and citations

The goal is answers that come only from the documentation, citations that can always be verified, and a refusal
whenever the docs don't contain the answer. Decision record: ADR-0003.

## 1. Chunking

- Split at Markdown headings (`#`–`######`, ignoring code fences) and keep the heading path for each section.
- Within a section, pack paragraphs greedily up to `CHUNK_SIZE` (800 characters). Oversized paragraphs split by sentence, then by character.
- Each new chunk starts with the last ~`CHUNK_OVERLAP` (120) characters of the previous one, cut at a word boundary, so facts that span a boundary still match.
- The embedded text is `"<document title> > <heading path>\n\n<chunk text>"`, which gives short chunks their context.

## 2. Identifiers (anti-hallucination by construction)

| Id | Format | Source |
| --- | --- | --- |
| `sourceId` | file name slug, e.g. `sso-setup-guide` | file system |
| `chunkId` | `<sourceId>#<index>`, e.g. `sso-setup-guide#4` | chunker, deterministic |

The model never creates an id that the system trusts. It can only repeat ids it was shown.

## 3. Retrieval

- Embed the question with the same model used for the chunks.
- Run cosine similarity over the in-memory index and take the `TOP_K` (5) best matches.
- Keep only chunks with a score of at least `MIN_SIMILARITY` (0.3). If none qualify, **refuse without calling the LLM**. This is cheap and removes the chance of an answer from no context.

## 4. Generation

`gpt-4.1-mini`, temperature 0, OpenAI Structured Outputs (strict JSON schema):

```json
{ "answerable": true, "answer": "… [chunk-id] …", "citedChunkIds": ["chunk-id"] }
```

The system prompt ([`backend/src/llm/prompts/grounded-answer.prompt.ts`](../backend/src/llm/prompts/grounded-answer.prompt.ts)) requires:

- only facts stated in the excerpts, with no prior knowledge and no extrapolated numbers;
- `answerable: false` when the excerpts don't contain the answer, and a statement of what is missing for partial answers;
- exact ids only, and only for chunks actually used;
- excerpts treated as untrusted data, ignoring any instructions inside them.

Chunks are sent as `<chunk id="…" document="…" section="…">…</chunk>`. Attribute values are escaped, and any
`<chunk>`/`</chunk>` inside document text is neutralised so a document can't forge a delimiter.

If the output is invalid JSON it is retried once, then the request fails with `502`. A model-level refusal is treated as `answerable: false`.

## 5. Citation validation

`CitationValidator` takes the model output and **the chunks retrieved for this request**:

1. Collect the ids from `citedChunkIds` and from inline `[id]` markers, without duplicates.
2. Keep an id only if it is in the retrieved set. An id that exists elsewhere in the index but wasn't retrieved is also rejected.
3. Remove inline markers for rejected ids from the answer, and log the rejected ids as a warning.
4. If `answerable` is false, the answer is empty, or no valid id remains, return a **refusal**.

Citations in the response (`documentTitle`, `textSnippet`) are built from the vector store entries, never copied from model text.

## 6. Refusal

A refusal returns `refused: true`, no citations, and a fixed message. The UI shows it with a distinct
"Not found in documentation" style so CSMs don't mistake it for an answer.

## Tuning

| Symptom | Adjust |
| --- | --- |
| Valid questions refused | Lower `MIN_SIMILARITY` (0.25), raise `TOP_K`, improve headings in the source docs |
| Off-topic questions answered | Raise `MIN_SIMILARITY` |
| Answers miss details split across chunks | Raise `CHUNK_OVERLAP` or `CHUNK_SIZE` |

## Limitations

- Similarity thresholds depend on the embedding model. Re-tune `MIN_SIMILARITY` if you change it.
- No reranker and no hybrid keyword search yet. Exact codes or names may retrieve less reliably than prose.
- The model could still misstate a fact from a cited chunk. Citations let the CSM verify it in one click.
