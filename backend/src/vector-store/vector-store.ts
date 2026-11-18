import { Chunk } from '../documents/documents.types';

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

export interface SearchResult {
  chunk: Chunk;
  /** Cosine similarity in [-1, 1]. */
  score: number;
}

/** Storage abstraction (DI token). MVP implementation is in-memory; swap for pgvector/Qdrant later. */
export abstract class VectorStore {
  /** Atomically replace the whole index. */
  abstract replaceAll(items: EmbeddedChunk[]): void;
  abstract search(query: number[], topK: number): SearchResult[];
  abstract getChunk(chunkId: string): Chunk | undefined;
  abstract size(): number;
}
