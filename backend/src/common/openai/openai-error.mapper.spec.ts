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
