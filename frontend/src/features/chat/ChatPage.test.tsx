import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderWithClient } from '../../test/utils';
import type { ChatResponse } from '../../types/api';
import { ChatPage } from './ChatPage';

const answer: ChatResponse = {
  answer: 'Premium Severity 1 incidents get a first response within 1 hour [sla-and-support-tiers#3].',
  refused: false,
  citations: [
    {
      sourceId: 'sla-and-support-tiers',
      documentTitle: 'SLA and Support Tiers',
      chunkId: 'sla-and-support-tiers#3',
      textSnippet: 'First response targets are measured from ticket creation to the first human reply.',
    },
  ],
};

async function ask(question: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/your question/i), question);
  await user.click(screen.getByRole('button', { name: /^ask$/i }));
}

describe('ChatPage', () => {
  it('sends the question and shows the answer with numbered citations', async () => {
    const fetch = mockFetch({ 'POST /api/chat': { body: answer } });
    renderWithClient(<ChatPage />);

    await ask('Premium S1 response time?');

    expect(await screen.findByText(/first response within 1 hour/)).toBeInTheDocument();
    expect(screen.getByText('Premium S1 response time?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '[1]' })).toHaveAttribute('href', expect.stringMatching(/#cite-.+-1$/));
    const sources = screen.getByRole('region', { name: /sources/i });
    expect(sources).toHaveTextContent('SLA and Support Tiers');
    expect(sources).toHaveTextContent('sla-and-support-tiers#3');
    expect(sources).toHaveTextContent('First response targets are measured');
    expect(JSON.parse(fetch.mock.calls[0][1]!.body as string)).toEqual({ question: 'Premium S1 response time?' });
  });

  it('shows a refusal distinctly when the docs have no answer', async () => {
    mockFetch({
      'POST /api/chat': { body: { answer: "I couldn't find an answer to that.", citations: [], refused: true } },
    });
    renderWithClient(<ChatPage />);
    await ask('What is the capital of France?');

    const refusal = await screen.findByTestId('refusal');
    expect(refusal).toHaveTextContent(/not found in documentation/i);
    expect(screen.queryByRole('region', { name: /sources/i })).not.toBeInTheDocument();
  });

  it('shows the server error message when the request fails', async () => {
    mockFetch({
      'POST /api/chat': {
        status: 503,
        body: { statusCode: 503, error: 'Service Unavailable', message: 'The knowledge base is not loaded yet.' },
      },
    });
    renderWithClient(<ChatPage />);
    await ask('Any question here');

    expect(await screen.findByRole('alert')).toHaveTextContent('The knowledge base is not loaded yet.');
  });

  it('validates the input before sending', async () => {
    const fetch = mockFetch({});
    renderWithClient(<ChatPage />);
    await ask('  a ');

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 3 characters/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('disables the input while a request is in flight', async () => {
    let resolve!: (v: Response) => void;
    mockFetch({ 'POST /api/chat': () => new Promise<never>((r) => (resolve = r as never)) });
    renderWithClient(<ChatPage />);
    await ask('Pending question');

    expect(screen.getByRole('button', { name: /asking/i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(/searching/i);
    resolve({ ok: true, status: 200, json: async () => answer } as Response);
    await waitFor(() => expect(screen.getByRole('button', { name: /^ask$/i })).toBeEnabled());
  });

  it('sends an example question from the empty state', async () => {
    mockFetch({ 'POST /api/chat': { body: answer } });
    renderWithClient(<ChatPage />);
    await userEvent.setup().click(screen.getByRole('button', { name: /severity 1 incident/i }));
    expect(await screen.findByText(/first response within 1 hour/)).toBeInTheDocument();
  });
});
