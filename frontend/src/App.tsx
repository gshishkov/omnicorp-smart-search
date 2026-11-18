import { useState } from 'react';
import { Header } from './components/Header';
import { ChatPage } from './features/chat/ChatPage';
import { DocumentsPanel } from './features/documents/components/DocumentsPanel';

export default function App() {
  const [docsOpen, setDocsOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <Header onToggleDocuments={() => setDocsOpen((o) => !o)} documentsOpen={docsOpen} />
      <div className="relative flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <ChatPage />
        </main>

        {/* Desktop: fixed sidebar. Mobile/tablet: slide-over drawer. */}
        <aside className="hidden w-96 shrink-0 border-l border-slate-200 bg-white lg:block">
          <DocumentsPanel />
        </aside>
        {docsOpen && (
          <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-label="Knowledge base documents">
            <button
              type="button"
              aria-label="Close documents panel"
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setDocsOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
              <DocumentsPanel onClose={() => setDocsOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
