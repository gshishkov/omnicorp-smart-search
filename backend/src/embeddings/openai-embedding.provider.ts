import { Inject, Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from '../common/openai/openai-client.provider';
import { mapOpenAiError } from '../common/openai/openai-error.mapper';
import { AppConfigService } from '../config/app-config.service';
import { EmbeddingProvider } from './embedding-provider';

const BATCH_SIZE = 100;

@Injectable()
export class OpenAiEmbeddingProvider extends EmbeddingProvider {
  readonly modelName: string;

  constructor(
    @Inject(OPENAI_CLIENT) private readonly client: OpenAI,
    config: AppConfigService,
  ) {
    super();
    this.modelName = config.get('OPENAI_EMBEDDING_MODEL');
  }

  async embed(texts: string[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      try {
        const res = await this.client.embeddings.create({ model: this.modelName, input: batch });
        const ordered = [...res.data].sort((a, b) => a.index - b.index);
        vectors.push(...ordered.map((d) => d.embedding));
      } catch (err) {
        throw mapOpenAiError(err, 'embedding generation');
      }
    }
    return vectors;
  }
}
