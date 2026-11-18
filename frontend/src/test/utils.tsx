import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

export function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

type Route = { status?: number; body: unknown } | (() => Promise<never>);

/** Stub global fetch with responses keyed by "METHOD /path". */
export function mockFetch(routes: Record<string, Route>) {
  const fn = vi.fn(async (url: string, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${url}`;
    const route = routes[key];
    if (!route) throw new Error(`Unexpected fetch: ${key}`);
    if (typeof route === 'function') return route();
    const status = route.status ?? 200;
    return { ok: status >= 200 && status < 300, status, json: async () => route.body } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
