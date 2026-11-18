import { ConflictException } from '@nestjs/common';
import { existsSync } from 'fs';
import * as path from 'path';
import { FakeEmbeddingProvider } from '../../test/fakes/fake-embedding.provider';
import { AppConfigService } from '../config/app-config.service';
import { Env } from '../config/env.validation';
import { InMemoryVectorStore } from '../vector-store/in-memory-vector-store';
import { ChunkerService } from './chunker.service';
import { DocumentLoaderService } from './document-loader.service';
import { DocumentsService } from './documents.service';

const FIXTURES = path.join(__dirname, '..', '..', 'test', 'fixtures', 'kb');

function make(sourceDir = FIXTURES) {
  const values: Partial<Env> = { SOURCE_DIR: sourceDir, CHUNK_SIZE: 800, CHUNK_OVERLAP: 100, LOAD_DOCUMENTS_ON_STARTUP: false };
  const config = { get: (k: keyof Env) => values[k] } as unknown as AppConfigService;
  const embeddings = new FakeEmbeddingProvider();
  const store = new InMemoryVectorStore();
  const service = new DocumentsService(config, new DocumentLoaderService(), new ChunkerService(), embeddings, store);
  return { service, embeddings, store };
}

describe('DocumentsService', () => {
  it('loads, chunks, embeds and indexes documents', async () => {
    const { service, store } = make();
    const result = await service.reload();
    expect(result).toMatchObject({ status: 'completed', documentsLoaded: 2, errors: [] });
    expect(store.size()).toBe(result.chunksCreated);
    expect(service.list().reduce((n, d) => n + d.chunkCount, 0)).toBe(result.chunksCreated);
    expect(service.getStatus().status).toBe('ready');
  });

  it('returns a failed result when no documents exist', async () => {
    const { service } = make(path.join(FIXTURES, 'does-not-exist'));
    const result = await service.reload();
    expect(result.status).toBe('failed');
    expect(result.errors.join(' ')).toMatch(/not found/);
    expect(service.getStatus().status).toBe('failed');
  });

  it('rejects a concurrent reload with 409', async () => {
    const { service } = make();
    const first = service.reload();
    await expect(service.reload()).rejects.toBeInstanceOf(ConflictException);
    await first;
  });

  it('keeps the previous index when embedding fails', async () => {
    const { service, embeddings, store } = make();
    await service.reload();
    const size = store.size();
    embeddings.failNext = new Error('provider down');
    await expect(service.reload()).rejects.toThrow('provider down');
    expect(store.size()).toBe(size);
    expect(service.getStatus().status).toBe('ready');
  });
});

const REPO_SOURCE = path.join(__dirname, '..', '..', '..', 'source');

// Runs whenever the repo's source/ folder is reachable (locally, or mounted at /source in the test image).
(existsSync(REPO_SOURCE) ? describe : describe.skip)('repository knowledge base (source/)', () => {
  it('loads all articles with unique, titled sources', async () => {
    const { service } = make(REPO_SOURCE);
    const result = await service.reload();
    expect(result.status).toBe('completed');
    expect(result.documentsLoaded).toBeGreaterThanOrEqual(3);
    expect(result.documentsLoaded).toBeLessThanOrEqual(5);
    expect(result.errors).toEqual([]);
    for (const doc of service.list()) {
      expect(doc.title).not.toBe(doc.sourceId);
      expect(doc.chunkCount).toBeGreaterThan(0);
    }
  });
});
