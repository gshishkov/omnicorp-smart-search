import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockFetch, renderWithClient } from '../../../test/utils';
import { DocumentsPanel } from './DocumentsPanel';

const docs = [
  { sourceId: 'billing-and-refunds', title: 'Billing and Refunds Policy', fileName: 'billing-and-refunds.md', chunkCount: 7, sizeBytes: 2560, loadedAt: '2026-11-18T12:00:00Z' },
  { sourceId: 'sso-setup-guide', title: 'Single Sign-On (SSO) Setup Guide', fileName: 'sso-setup-guide.md', chunkCount: 9, sizeBytes: 3100, loadedAt: '2026-11-18T12:00:00Z' },
];

describe('DocumentsPanel', () => {
  it('lists document metadata', async () => {
    mockFetch({ 'GET /api/documents': { body: docs } });
    renderWithClient(<DocumentsPanel />);

    expect(await screen.findByText('Billing and Refunds Policy')).toBeInTheDocument();
    expect(screen.getByText('sso-setup-guide')).toBeInTheDocument();
    expect(screen.getByText('2 documents · 16 chunks')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('reloads documents and shows the statistics', async () => {
    const fetch = mockFetch({
      'GET /api/documents': { body: docs },
      'POST /api/documents/reload': {
        body: { status: 'completed', documentsLoaded: 2, chunksCreated: 16, durationMs: 1250, errors: [] },
      },
    });
    renderWithClient(<DocumentsPanel />);
    await screen.findByText('Billing and Refunds Policy');
    await userEvent.setup().click(screen.getByRole('button', { name: /reload/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Reload completed: 2 documents, 16 chunks in 1.3 s');
    // List is refetched after a reload.
    expect(fetch.mock.calls.filter(([u, i]) => u === '/api/documents' && !i?.method)).toHaveLength(2);
  });

  it('shows an empty state', async () => {
    mockFetch({ 'GET /api/documents': { body: [] } });
    renderWithClient(<DocumentsPanel />);
    expect(await screen.findByText(/no documents loaded yet/i)).toBeInTheDocument();
  });
});
