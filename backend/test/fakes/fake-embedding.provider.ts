import { EmbeddingProvider } from '../../src/embeddings/embedding-provider';

const STOPWORDS = new Set(
  'a an and are as at be by can do does for from how i in is it of on or our the their there this to what when where which who why with within you your'.split(
    ' ',
  ),
);
const DIMENSIONS = 512;

function hash(token: string): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % DIMENSIONS;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t));
}

/** Deterministic bag-of-words embeddings: no network, stable similarity for tests. */
export class FakeEmbeddingProvider extends EmbeddingProvider {
  readonly modelName = 'fake-embedding';
  calls = 0;
  failNext: Error | null = null;

  async embed(texts: string[]): Promise<number[][]> {
    this.calls++;
    if (this.failNext) {
      const err = this.failNext;
      this.failNext = null;
      throw err;
    }
    return texts.map((text) => {
      const v = new Array<number>(DIMENSIONS).fill(0);
      for (const token of tokenize(text)) v[hash(token)] += 1;
      return v;
    });
  }
}
