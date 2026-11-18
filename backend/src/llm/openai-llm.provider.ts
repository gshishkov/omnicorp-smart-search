import { BadGatewayException, Inject, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { OPENAI_CLIENT } from '../common/openai/openai-client.provider';
import { mapOpenAiError } from '../common/openai/openai-error.mapper';
import { AppConfigService } from '../config/app-config.service';
import { GroundedAnswer, GroundedAnswerRequest, LlmProvider } from './llm-provider';
import {
  buildGroundedAnswerUserPrompt,
  GROUNDED_ANSWER_JSON_SCHEMA,
  GROUNDED_ANSWER_SYSTEM_PROMPT,
} from './prompts/grounded-answer.prompt';

const groundedAnswerSchema = z.object({
  answerable: z.boolean(),
  answer: z.string(),
  citedChunkIds: z.array(z.string()),
});

const MAX_ATTEMPTS = 2;

@Injectable()
export class OpenAiLlmProvider extends LlmProvider {
  private readonly logger = new Logger(OpenAiLlmProvider.name);
  readonly modelName: string;

  constructor(
    @Inject(OPENAI_CLIENT) private readonly client: OpenAI,
    config: AppConfigService,
  ) {
    super();
    this.modelName = config.get('OPENAI_CHAT_MODEL');
  }

  async generateGroundedAnswer({ question, chunks }: GroundedAnswerRequest): Promise<GroundedAnswer> {
    const userPrompt = buildGroundedAnswerUserPrompt(question, chunks);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let completion: OpenAI.Chat.Completions.ChatCompletion;
      const started = Date.now();
      try {
        completion = await this.client.chat.completions.create({
          model: this.modelName,
          temperature: 0,
          max_tokens: 900,
          messages: [
            { role: 'system', content: GROUNDED_ANSWER_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'grounded_answer', strict: true, schema: GROUNDED_ANSWER_JSON_SCHEMA },
          },
        });
      } catch (err) {
        throw mapOpenAiError(err, 'answer generation');
      }

      const usage = completion.usage;
      this.logger.log(
        `model=${this.modelName} latencyMs=${Date.now() - started} promptTokens=${usage?.prompt_tokens ?? '?'} completionTokens=${usage?.completion_tokens ?? '?'}`,
      );

      const message = completion.choices[0]?.message;
      if (message?.refusal) {
        return { answerable: false, answer: '', citedChunkIds: [] };
      }
      const parsed = this.parse(message?.content);
      if (parsed) return parsed;
      this.logger.warn(`Model returned invalid structured output (attempt ${attempt}/${MAX_ATTEMPTS})`);
    }
    throw new BadGatewayException('AI provider returned an invalid response. Please try again.');
  }

  private parse(content: string | null | undefined): GroundedAnswer | null {
    if (!content) return null;
    try {
      const result = groundedAnswerSchema.safeParse(JSON.parse(content));
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }
}
