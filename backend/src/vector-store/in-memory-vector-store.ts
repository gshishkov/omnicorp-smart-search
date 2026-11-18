import { Injectable } from '@nestjs/common';
import { Chunk } from '../documents/documents.types';
import { EmbeddedChunk, SearchResult, VectorStore } from './vector-store';

interface IndexedChunk {
  chunk: Chunk;
  vector: Float64Array;
}

export function normalize(v: number[]): Float64Array {
  const out = Float64Array.from(v);
  let norm = 0;
  for (const x of out) norm += x * x;
  norm = Math.sqrt(norm);
  if (norm === 0) return out;
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

function dot(a: Float64Array, b: Float64Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

@Injectable()
export class InMemoryVectorStore extends VectorStore {
  private items: IndexedChunk[] = [];
  private byId = new Map<string, Chunk>();
  private dimension = 0;

  replaceAll(items: EmbeddedChunk[]): void {
    const dims = new Set(items.map((i) => i.embedding.length));
    if (dims.size > 1) throw new Error('All embeddings must have the same dimension');
    const indexed = items.map(({ embedding, ...chunk }) => ({ chunk, vector: normalize(embedding) }));
    // Swap in one step so concurrent searches never see a half-built index.
    this.items = indexed;
    this.byId = new Map(indexed.map((i) => [i.chunk.chunkId, i.chunk]));
    this.dimension = items[0]?.embedding.length ?? 0;
  }

  search(query: number[], topK: number): SearchResult[] {
    if (!this.items.length || topK <= 0) return [];
    if (query.length !== this.dimension) {
      throw new Error(`Query dimension ${query.length} does not match index dimension ${this.dimension}`);
    }
    const q = normalize(query);
    return this.items
      .map((i) => ({ chunk: i.chunk, score: dot(q, i.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  getChunk(chunkId: string): Chunk | undefined {
    return this.byId.get(chunkId);
  }

  size(): number {
    return this.items.length;
  }
}
