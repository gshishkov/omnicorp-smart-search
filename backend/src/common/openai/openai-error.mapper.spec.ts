import { BadGatewayException, GatewayTimeoutException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { mapOpenAiError } from './openai-error.mapper';

const apiError = (status: number) => OpenAI.APIError.generate(status, { message: 'sk-secret leaked?' }, 'boom', {});

describe('mapOpenAiError', () => {
  it.each([
    [401, BadGatewayException],
    [429, ServiceUnavailableException],
    [404, BadGatewayException],
    [500, BadGatewayException],
  ])('maps status %s', (status, type) => {
    const mapped = mapOpenAiError(apiError(status), 'test');
    expect(mapped).toBeInstanceOf(type);
    expect(mapped.message).not.toContain('sk-secret');
  });

  it('distinguishes exhausted quota from rate limiting', () => {
    const quota = OpenAI.APIError.generate(429, { error: { code: 'insufficient_quota', message: 'x' } }, 'x', {});
    expect(mapOpenAiError(quota, 'test').message).toMatch(/quota exhausted/);
    const credits = OpenAI.APIError.generate(
      429,
      { error: { type: 'insufficient_quota', code: 'credit_balance_exhausted', message: 'x' } },
      'x',
      {},
    );
    expect(mapOpenAiError(credits, 'test').message).toMatch(/quota exhausted/);
    expect(mapOpenAiError(apiError(429), 'test').message).toMatch(/rate limit reached/);
  });

  it('maps timeouts and connection errors', () => {
    expect(mapOpenAiError(new OpenAI.APIConnectionTimeoutError(), 'x')).toBeInstanceOf(GatewayTimeoutException);
    expect(mapOpenAiError(new OpenAI.APIConnectionError({ message: 'down' }), 'x')).toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('passes HTTP exceptions through and wraps unknown errors', () => {
    const http = new NotFoundException();
    expect(mapOpenAiError(http, 'x')).toBe(http);
    expect(mapOpenAiError(new Error('?'), 'x')).toBeInstanceOf(BadGatewayException);
  });
});
