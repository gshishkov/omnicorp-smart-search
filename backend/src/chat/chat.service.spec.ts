import { ServiceUnavailableException } from '@nestjs/common';
import { FakeEmbeddingProvider } from '../../test/fakes/fake-embedding.provider';
import { FakeLlmProvider } from '../../test/fakes/fake-llm.provider';
import { AppConfigService } from '../config/app-config.service';
import { Env } from '../config/env.validation';
import { Chunk } from '../documents/documents.types';
import { InMemoryVectorStore } from '../vector-store/in-memory-vector-store';
import { ChatService, REFUSAL_MESSAGE } from './chat.service';
import { CitationValidator } from './citation-validator';

const config = (overrides: Partial<Env> = {}) =>
  ({ get: (k: keyof Env) => ({ TOP_K: 3, MIN_SIMILARITY: 0.2, ...overrides })[k as 'TOP_K'] }) as unknown as AppConfigService;

const chunks: Chunk[] = [
  {
    chunkId: 'sla#0',
    sourceId: 'sla',
    documentTitle: 'SLA and Support Tiers',
    headingPath: ['First response targets'],
    index: 0,
    text: 'Premium customers get a first response within 1 hour for Severity 1 incidents.',
  },
  {
    chunkId: 'billing#0',
    sourceId: 'billing',
    documentTitle: 'Billing and Refunds',
    headingPath: ['Refunds'],
    index: 0,
    text: 'Annual plans can be refunded within 30 days of the contract start date.',
  },
];

async function setup(overrides: Partial<Env> = {}) {
  const embeddings = new FakeEmbeddingProvider();
  const llm = new FakeLlmProvider();
  const store = new InMemoryVectorStore();
  const vectors = await embeddings.embed(chunks.map((c) => c.text));
  store.replaceAll(chunks.map((c, i) => ({ ...c, embedding: vectors[i] })));
  const service = new ChatService(config(overrides), embeddings, store, llm, new CitationValidator());
  return { service, llm, store };
}

describe('ChatService', () => {
  it('returns a grounded answer with citations built from the store', async () => {
    const { service, llm } = await setup();
    const res = await service.ask('What is the first response time for Premium Severity 1 incidents?');
    expect(res.refused).toBe(false);
    expect(res.citations).toEqual([
      {
        sourceId: 'sla',
        documentTitle: 'SLA and Support Tiers',
        chunkId: 'sla#0',
        textSnippet: chunks[0].text,
      },
    ]);
    expect(llm.requests[0].chunks[0].chunkId).toBe('sla#0');
  });

  it('refuses without calling the LLM when nothing is similar enough', async () => {
    const { service, llm } = await setup();
    const res = await service.ask('Who painted the Mona Lisa?');
    expect(res).toEqual({ answer: REFUSAL_MESSAGE, citations: [], refused: true });
    expect(llm.requests).toHaveLength(0);
  });

  it('only sends chunks above the similarity threshold to the LLM', async () => {
    const { service, llm } = await setup({ MIN_SIMILARITY: 0.2 });
    await service.ask('Can annual plans be refunded within 30 days?');
    expect(llm.requests[0].chunks.map((c) => c.chunkId)).toEqual(['billing#0']);
  });

  it('refuses when the LLM cites a chunk that was not retrieved', async () => {
    const { service, llm } = await setup();
    llm.respondWith(() => ({ answerable: true, answer: 'Within 1 hour [sla#0].', citedChunkIds: ['sla#0'] }));
    // sla#0 exists in the store but is not retrieved for a refund question.
    const res = await service.ask('Can annual plans be refunded within 30 days?');
    expect(res.refused).toBe(true);
  });

  it('refuses when the LLM reports the question is not answerable', async () => {
    const { service, llm } = await setup();
    llm.respondWith(() => ({ answerable: false, answer: '', citedChunkIds: [] }));
    expect((await service.ask('What is the Premium first response time?')).refused).toBe(true);
  });

  it('throws 503 when the knowledge base is empty', async () => {
    const service = new ChatService(
      config(),
      new FakeEmbeddingProvider(),
      new InMemoryVectorStore(),
      new FakeLlmProvider(),
      new CitationValidator(),
    );
    await expect(service.ask('anything here?')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
