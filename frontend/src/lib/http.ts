import type { ApiErrorBody } from '../types/api';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isErrorBody(v: unknown): v is ApiErrorBody {
  return typeof v === 'object' && v !== null && 'message' in v;
}

/** Typed JSON fetch against the backend. Always relative (`/api`) — the API key never reaches the browser. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the SmartSearch server. Check your connection and try again.');
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = isErrorBody(body)
      ? Array.isArray(body.message)
        ? body.message.join('. ')
        : body.message
      : `Request failed with status ${res.status}.`;
    throw new ApiError(res.status, message, isErrorBody(body) ? body.requestId : undefined);
  }
  return body as T;
}
