# API reference

Base path: `/api`. All bodies are JSON. Interactive docs: `/api/docs` (Swagger).
This file is the contract; `frontend/src/types/api.ts` mirrors it.

## POST /api/chat

Ask a question. The answer is grounded only in the knowledge base.

Request:

```json
{ "question": "Can a customer get a refund on an annual plan?" }
```

| Field | Rules |
| --- | --- |
| `question` | string, trimmed, 3–1000 characters, required. No other fields are allowed. |

Response `200`:

```json
{
  "answer": "New customers on an annual plan can cancel within 30 days of the initial contract start date for a full refund [billing-and-refunds#3].",
  "citations": [
    {
      "sourceId": "billing-and-refunds",
      "documentTitle": "Billing and Refunds Policy",
      "chunkId": "billing-and-refunds#3",
      "textSnippet": "New customers on an annual plan can cancel within 30 days of the initial contract start date for a full refund. …"
    }
  ],
  "refused": false
}
```

- `answer` may contain inline markers `[<chunkId>]`. Every marker refers to an entry in `citations`.
- `citations[].chunkId` is always one of the chunks retrieved for this question, and `documentTitle` and `textSnippet` come from the store, never from the model.
- A refusal returns `200` with `refused: true`, `citations: []` and a fixed message.

## POST /api/documents/reload

Re-reads `SOURCE_DIR`, re-chunks and re-embeds everything, then atomically replaces the index.

Response `200`:

```json
{ "status": "completed", "documentsLoaded": 5, "chunksCreated": 38, "durationMs": 1840, "errors": [] }
```

`status: "failed"` (still `200`) means no documents could be loaded. `errors` explains why, and the previous index is kept.
Per-file problems (empty file, file too large, duplicate id) appear in `errors` while the other files still load.

## GET /api/documents

Response `200`:

```json
[
  {
    "sourceId": "billing-and-refunds",
    "title": "Billing and Refunds Policy",
    "fileName": "billing-and-refunds.md",
    "chunkCount": 7,
    "sizeBytes": 2731,
    "loadedAt": "2026-11-18T13:45:00.000Z"
  }
]
```

## GET /api/health

```json
{ "status": "ok", "knowledgeBase": { "status": "ready", "documents": 5, "chunks": 38 } }
```

`knowledgeBase.status` is one of `empty`, `loading`, `ready` or `failed`.

## Errors

Every error has the same shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["question must be at least 3 characters"],
  "path": "/api/chat",
  "timestamp": "2026-11-18T13:45:00.000Z",
  "requestId": "6f1c…"
}
```

| Status | When |
| --- | --- |
| 400 | Invalid DTO, unknown field, malformed JSON, body over 16 KB |
| 409 | A reload is already running |
| 429 | Chat rate limit exceeded |
| 502 | AI provider error, invalid credentials, unknown model, or invalid model output |
| 503 | Knowledge base not loaded yet, or provider unreachable or rate-limited |
| 504 | AI provider timeout |

Send an `x-request-id` header (8–64 characters, `[A-Za-z0-9-]`) to correlate logs. Otherwise one is generated and returned.
