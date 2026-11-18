import { Module, Provider } from '@nestjs/common';
import OpenAI from 'openai';
import { AppConfigService } from '../../config/app-config.service';

export const OPENAI_CLIENT = Symbol('OPENAI_CLIENT');

/** Single OpenAI SDK instance. The API key is read from validated config and never leaves the backend. */
export const openAiClientProvider: Provider = {
  provide: OPENAI_CLIENT,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService) =>
    new OpenAI({
      apiKey: config.get('OPENAI_API_KEY'),
      timeout: config.get('OPENAI_TIMEOUT_MS'),
      maxRetries: 2,
    }),
};

@Module({
  providers: [openAiClientProvider],
  exports: [OPENAI_CLIENT],
})
export class OpenAiModule {}
