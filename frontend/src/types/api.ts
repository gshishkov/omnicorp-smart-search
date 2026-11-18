// Mirrors docs/api.md and the backend DTOs. Keep in sync.

export interface ChatRequest {
  question: string;
}

export interface Citation {
  sourceId: string;
  documentTitle: string;
  chunkId: string;
  textSnippet: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  refused: boolean;
}

export interface DocumentMetadata {
  sourceId: string;
  title: string;
  fileName: string;
  chunkCount: number;
  sizeBytes: number;
  loadedAt: string;
}

export interface ReloadResult {
  status: 'completed' | 'failed';
  documentsLoaded: number;
  chunksCreated: number;
  durationMs: number;
  errors: string[];
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path?: string;
  timestamp?: string;
  requestId?: string;
}

export const QUESTION_MIN_LENGTH = 3;
export const QUESTION_MAX_LENGTH = 1000;
