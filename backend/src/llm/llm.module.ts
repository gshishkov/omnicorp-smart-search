import { Module } from '@nestjs/common';
import { OpenAiModule } from '../common/openai/openai-client.provider';
import { LlmProvider } from './llm-provider';
import { OpenAiLlmProvider } from './openai-llm.provider';

@Module({
  imports: [OpenAiModule],
  providers: [{ provide: LlmProvider, useClass: OpenAiLlmProvider }],
  exports: [LlmProvider],
})
export class LlmModule {}
