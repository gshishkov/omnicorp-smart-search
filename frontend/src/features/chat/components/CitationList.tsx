import { useState } from 'react';
import type { Citation } from '../../../types/api';

interface CitationListProps {
  citations: Citation[];
  messageId: string;
}

function CitationCard({ citation, n, messageId }: { citation: Citation; n: number; messageId: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li id={`cite-${messageId}-${n}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-brand-700">[{n}]</span>
        <span className="font-medium text-slate-900">{citation.documentTitle}</span>
        <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200">{citation.chunkId}</code>
      </div>
      <p className={`mt-2 text-slate-600 ${expanded ? '' : 'line-clamp-3'}`}>{citation.textSnippet}</p>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-1 text-xs font-medium text-brand-600 hover:underline"
        aria-expanded={expanded}
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </li>
  );
}

export function CitationList({ citations, messageId }: CitationListProps) {
  if (!citations.length) return null;
  return (
    <section aria-label="Sources" className="mt-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sources</h3>
      <ol className="space-y-2">
        {citations.map((c, i) => (
          <CitationCard key={c.chunkId} citation={c} n={i + 1} messageId={messageId} />
        ))}
      </ol>
    </section>
  );
}
