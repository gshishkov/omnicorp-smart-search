/** Embedding abstraction (DI token). Swap the vendor by providing another implementation. */
export abstract class EmbeddingProvider {
  abstract readonly modelName: string;
  /** Returns one vector per input text, in input order. */
  abstract embed(texts: string[]): Promise<number[][]>;
}
