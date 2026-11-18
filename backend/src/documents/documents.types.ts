export interface SourceDocument {
  /** Deterministic id derived from the file name, e.g. `sla-and-support-tiers`. */
  sourceId: string;
  title: string;
  fileName: string;
  /** Markdown body without front-matter. */
  content: string;
  sizeBytes: number;
}

export interface Chunk {
  /** Deterministic id `<sourceId>#<index>`; the only id the API trusts. */
  chunkId: string;
  sourceId: string;
  documentTitle: string;
  /** Headings above this chunk, outermost first. */
  headingPath: string[];
  index: number;
  text: string;
}

export interface DocumentMetadata {
  sourceId: string;
  title: string;
  fileName: string;
  chunkCount: number;
  sizeBytes: number;
  loadedAt: string;
}

export type ReloadStatus = 'completed' | 'failed';

export interface ReloadResult {
  status: ReloadStatus;
  documentsLoaded: number;
  chunksCreated: number;
  durationMs: number;
  errors: string[];
}

export type KnowledgeBaseStatus = 'empty' | 'loading' | 'ready' | 'failed';
