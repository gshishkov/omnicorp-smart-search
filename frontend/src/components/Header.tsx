import { OmniCorpLogo } from './OmniCorpLogo';

interface HeaderProps {
  onToggleDocuments: () => void;
  documentsOpen: boolean;
}

export function Header({ onToggleDocuments, documentsOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <OmniCorpLogo />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight tracking-tight">
              <span className="text-slate-900">Omni</span>
              <span className="text-brand-600">Corp</span>
              <span className="ml-2 hidden font-normal text-slate-500 sm:inline">SmartSearch</span>
            </p>
            <p className="truncate text-xs text-slate-500">
              <span className="sm:hidden">SmartSearch</span>
              <span className="hidden sm:inline">Answers from the Customer Success knowledge base, with sources</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleDocuments}
          aria-expanded={documentsOpen}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
        >
          Documents
        </button>
      </div>
    </header>
  );
}
