import { formatBytes, formatDuration } from '../../../lib/format';
import { useDocuments, useReloadDocuments } from '../hooks/useDocuments';

interface DocumentsPanelProps {
  onClose?: () => void;
}

export function DocumentsPanel({ onClose }: DocumentsPanelProps) {
  const docs = useDocuments();
  const reload = useReloadDocuments();
  const totalChunks = docs.data?.reduce((n, d) => n + d.chunkCount, 0) ?? 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">Knowledge base</h2>
          {docs.data && (
            <p className="text-xs text-slate-500">
              {docs.data.length} documents · {totalChunks} chunks
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => reload.mutate()}
            disabled={reload.isPending}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {reload.isPending ? 'Reloading…' : 'Reload'}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {reload.data && (
          <div
            role="status"
            className={`mb-3 rounded-lg p-3 text-sm ${reload.data.status === 'completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}
          >
            <p className="font-medium">
              Reload {reload.data.status}: {reload.data.documentsLoaded} documents, {reload.data.chunksCreated} chunks in{' '}
              {formatDuration(reload.data.durationMs)}
            </p>
            {reload.data.errors.map((e) => (
              <p key={e} className="mt-1 text-xs">
                {e}
              </p>
            ))}
          </div>
        )}
        {reload.error && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {reload.error.message}
          </p>
        )}

        {docs.isPending && <p className="text-sm text-slate-500">Loading documents…</p>}
        {docs.error && (
          <p role="alert" className="text-sm text-red-700">
            Could not load documents: {docs.error.message}
          </p>
        )}
        {docs.data && docs.data.length === 0 && (
          <p className="text-sm text-slate-500">No documents loaded yet. Add .md files to the source folder and press Reload.</p>
        )}
        {docs.data && docs.data.length > 0 && (
          <table className="w-full table-fixed text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="w-[60%] pb-2 font-medium">
                  Document
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Chunks
                </th>
                <th scope="col" className="pb-2 text-right font-medium">
                  Size
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.data.map((d) => (
                <tr key={d.sourceId}>
                  <td className="py-2 pr-2">
                    <p className="truncate font-medium text-slate-800" title={d.title}>
                      {d.title}
                    </p>
                    <p className="truncate font-mono text-xs text-slate-400" title={d.fileName}>
                      {d.sourceId}
                    </p>
                  </td>
                  <td className="py-2 text-right tabular-nums">{d.chunkCount}</td>
                  <td className="py-2 text-right tabular-nums text-slate-500">{formatBytes(d.sizeBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
