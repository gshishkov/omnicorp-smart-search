import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './http';

const respond = (status: number, body: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response));

describe('apiFetch', () => {
  it('returns parsed JSON on success', async () => {
    respond(200, { ok: 1 });
    await expect(apiFetch('/x')).resolves.toEqual({ ok: 1 });
  });

  it('joins validation messages into one readable error', async () => {
    respond(400, { statusCode: 400, error: 'Bad Request', message: ['a is bad', 'b is bad'], requestId: 'r1' });
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 400, message: 'a is bad. b is bad', requestId: 'r1' });
  });

  it('maps network failures to a friendly ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    const err = (await apiFetch('/x').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });
});
