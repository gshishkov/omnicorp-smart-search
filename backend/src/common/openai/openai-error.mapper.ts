import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';

/**
 * Convert OpenAI SDK errors into safe HTTP errors. Messages never include provider
 * payloads, headers or credentials — only what a client can act on.
 */
export function mapOpenAiError(err: unknown, operation: string): HttpException {
  if (err instanceof HttpException) return err;
  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    return new GatewayTimeoutException(`AI provider timed out during ${operation}. Please try again.`);
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return new ServiceUnavailableException(`AI provider is unreachable during ${operation}. Please try again later.`);
  }
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401 || err.status === 403) {
      return new BadGatewayException(
        'AI provider rejected the backend credentials. Check OPENAI_API_KEY in the backend configuration.',
      );
    }
    if (err.status === 429 && isQuotaError(err)) {
      return new ServiceUnavailableException(
        'AI provider quota exhausted for the configured API key. Check the OpenAI account billing and usage limits.',
      );
    }
    if (err.status === 429) {
      return new ServiceUnavailableException('AI provider rate limit reached. Please try again shortly.');
    }
    if (err.status === 404) {
      return new BadGatewayException('Configured AI model was not found. Check the model names in the backend configuration.');
    }
    return new BadGatewayException(`AI provider error during ${operation}.`);
  }
  return new BadGatewayException(`Unexpected error during ${operation}.`);
}

const QUOTA_CODES = new Set(['insufficient_quota', 'credit_balance_exhausted', 'billing_hard_limit_reached']);

function isQuotaError(err: InstanceType<typeof OpenAI.APIError>): boolean {
  return err.type === 'insufficient_quota' || QUOTA_CODES.has(String(err.code));
}
