import { BadGatewayException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { REFUSAL_MESSAGE } from '../src/chat/chat.service';
import { EmbeddingProvider } from '../src/embeddings/embedding-provider';
import { LlmProvider } from '../src/llm/llm-provider';
import { FakeEmbeddingProvider } from './fakes/fake-embedding.provider';
import { FakeLlmProvider } from './fakes/fake-llm.provider';

describe('SmartSearch API (e2e)', () => {
  let app: NestExpressApplication;
  let embeddings: FakeEmbeddingProvider;
  let llm: FakeLlmProvider;

  beforeAll(async () => {
    embeddings = new FakeEmbeddingProvider();
    llm = new FakeLlmProvider();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmbeddingProvider)
      .useValue(embeddings)
      .overrideProvider(LlmProvider)
      .useValue(llm)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  const server = () => app.getHttpServer();

  it('POST /api/chat returns 503 before the knowledge base is loaded', async () => {
    const res = await request(server()).post('/api/chat').send({ question: 'What are support hours?' });
    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ statusCode: 503, path: '/api/chat' });
    expect(res.body.message).toMatch(/knowledge base is not loaded/i);
  });

  it('POST /api/documents/reload loads markdown files and reports statistics', async () => {
    const res = await request(server()).post('/api/documents/reload').expect(200);
    expect(res.body).toMatchObject({ status: 'completed', documentsLoaded: 2, errors: [] });
    expect(res.body.chunksCreated).toBeGreaterThanOrEqual(4);
    expect(typeof res.body.durationMs).toBe('number');
  });

  it('GET /api/documents returns document metadata', async () => {
    const res = await request(server()).get('/api/documents').expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((d: { sourceId: string }) => d.sourceId).sort()).toEqual(['refund-policy', 'support-hours']);
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        fileName: expect.stringMatching(/\.md$/),
        chunkCount: expect.any(Number),
        sizeBytes: expect.any(Number),
        loadedAt: expect.any(String),
      }),
    );
  });

  it('GET /api/health reports a ready knowledge base', async () => {
    const res = await request(server()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', knowledgeBase: { status: 'ready', documents: 2, chunks: expect.any(Number) } });
  });

  it('POST /api/chat answers with citations that exist in the knowledge base', async () => {
    const res = await request(server())
      .post('/api/chat')
      .send({ question: 'How fast is the first response for Premium critical incidents?' })
      .expect(200);

    expect(res.body.refused).toBe(false);
    expect(res.body.answer).toMatch(/1 hour/);
    expect(res.body.citations[0]).toEqual({
      sourceId: 'support-hours',
      documentTitle: 'Support Hours',
      chunkId: expect.stringMatching(/^support-hours#\d+$/),
      textSnippet: expect.stringContaining('Premium customers'),
    });
  });

  it('POST /api/chat refuses an off-topic question without calling the LLM', async () => {
    const before = llm.requests.length;
    const res = await request(server()).post('/api/chat').send({ question: 'What is the capital of France?' }).expect(200);
    expect(res.body).toEqual({ answer: REFUSAL_MESSAGE, citations: [], refused: true });
    expect(llm.requests.length).toBe(before);
  });

  it('POST /api/chat drops hallucinated chunk ids and refuses when none remain', async () => {
    llm.respondWith(() => ({
      answerable: true,
      answer: 'Refunds take 90 days [refund-policy#99].',
      citedChunkIds: ['refund-policy#99', 'made-up-doc#1'],
    }));
    const res = await request(server()).post('/api/chat').send({ question: 'Can annual plans be refunded?' }).expect(200);
    expect(res.body.refused).toBe(true);
    expect(res.body.citations).toEqual([]);
  });

  it('POST /api/chat refuses when the model says the docs do not answer', async () => {
    llm.respondWith(() => ({ answerable: false, answer: '', citedChunkIds: [] }));
    const res = await request(server()).post('/api/chat').send({ question: 'Can annual plans be refunded?' }).expect(200);
    expect(res.body.refused).toBe(true);
  });

  it('POST /api/chat maps provider failures to a safe 502', async () => {
    llm.respondWith(() => {
      throw new BadGatewayException('AI provider error during answer generation.');
    });
    const res = await request(server()).post('/api/chat').send({ question: 'Can annual plans be refunded?' }).expect(502);
    expect(res.body.message).toBe('AI provider error during answer generation.');
    expect(JSON.stringify(res.body)).not.toContain('sk-test');
  });

  it.each([
    ['missing question', {}],
    ['empty question', { question: '   ' }],
    ['too short', { question: 'hi' }],
    ['wrong type', { question: 42 }],
    ['too long', { question: 'x'.repeat(1001) }],
    ['unknown field', { question: 'Valid question?', admin: true }],
  ])('POST /api/chat rejects invalid input (%s) with 400', async (_name, body) => {
    const res = await request(server()).post('/api/chat').send(body).expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request', path: '/api/chat' });
    expect(res.body.message).toBeDefined();
  });

  it('POST /api/chat reports the type error first for a non-string question', async () => {
    const res = await request(server()).post('/api/chat').send({ question: 42 }).expect(400);
    expect(res.body.message).toEqual(['question must be a string']);
  });

  it('POST /api/chat rejects malformed JSON with 400', async () => {
    const res = await request(server())
      .post('/api/chat')
      .set('Content-Type', 'application/json')
      .send('{"question": ')
      .expect(400);
    expect(res.body.statusCode).toBe(400);
  });

  it('echoes a request id header on every response', async () => {
    const res = await request(server()).get('/api/health').set('x-request-id', 'test-request-1234');
    expect(res.headers['x-request-id']).toBe('test-request-1234');
  });
});
