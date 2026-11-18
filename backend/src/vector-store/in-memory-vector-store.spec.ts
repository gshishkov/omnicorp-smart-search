import { Chunk } from '../documents/documents.types';
import { InMemoryVectorStore } from './in-memory-vector-store';

const chunk = (id: string): Chunk => ({
  chunkId: id,
  sourceId: id.split('#')[0],
  documentTitle: 'T',
  headingPath: [],
  index: Number(id.split('#')[1]),
  text: id,
});

describe('InMemoryVectorStore', () => {
  let store: InMemoryVectorStore;

  beforeEach(() => {
    store = new InMemoryVectorStore();
    store.replaceAll([
      { ...chunk('a#0'), embedding: [1, 0, 0] },
      { ...chunk('a#1'), embedding: [0.7, 0.7, 0] },
      { ...chunk('b#0'), embedding: [0, 0, 5] },
    ]);
  });

  it('ranks by cosine similarity, independent of vector magnitude', () => {
    const results = store.search([10, 0, 0], 3);
    expect(results.map((r) => r.chunk.chunkId)).toEqual(['a#0', 'a#1', 'b#0']);
    expect(results[0].score).toBeCloseTo(1);
    expect(results[1].score).toBeCloseTo(Math.SQRT1_2);
    expect(results[2].score).toBeCloseTo(0);
  });

  it('limits results to topK and returns stored chunks without embeddings', () => {
    const [top] = store.search([0, 0, 1], 1);
    expect(top.chunk).toEqual(chunk('b#0'));
    expect(store.search([0, 0, 1], 1)).toHaveLength(1);
  });

  it('looks up chunks by id and replaces the index atomically', () => {
    expect(store.getChunk('a#1')?.chunkId).toBe('a#1');
    store.replaceAll([{ ...chunk('c#0'), embedding: [1, 1] }]);
    expect(store.size()).toBe(1);
    expect(store.getChunk('a#1')).toBeUndefined();
  });

  it('rejects mismatched dimensions', () => {
    expect(() => store.search([1, 0], 1)).toThrow(/dimension/);
    expect(() => store.replaceAll([
      { ...chunk('x#0'), embedding: [1] },
      { ...chunk('x#1'), embedding: [1, 2] },
    ])).toThrow(/same dimension/);
  });

  it('returns nothing when empty', () => {
    expect(new InMemoryVectorStore().search([1], 3)).toEqual([]);
  });
});
