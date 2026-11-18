import { Module } from '@nestjs/common';
import { OpenAiModule } from '../common/openai/openai-client.provider';
import { EmbeddingProvider } from './embedding-provider';
import { OpenAiEmbeddingProvider } from './openai-embedding.provider';

@Module({
  imports: [OpenAiModule],
  providers: [{ provide: EmbeddingProvider, useClass: OpenAiEmbeddingProvider }],
  exports: [EmbeddingProvider],
})
export class EmbeddingsModule {}
