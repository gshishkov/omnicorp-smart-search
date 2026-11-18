import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

const EXAMPLES = [
  'What is the first response time for a Severity 1 incident on Premium?',
  'Can a customer get a refund on an annual plan?',
  'Which identity providers are supported for SSO?',
  'How long is data kept after a contract ends?',
];

interface MessageListProps {
  messages: ChatMessage[];
  isPending: boolean;
  onExample: (q: string) => void;
}

export function MessageList({ messages, isPending, onExample }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isPending]);

  if (!messages.length) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">How can I help?</h1>
        <p className="mt-2 text-slate-600">
          Ask a question about OmniCorp's internal documentation. Every answer comes only from the knowledge base, with
          the sources it used. If the docs don't cover it, I'll say so.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onExample(q)}
              disabled={isPending}
              className="rounded-xl border border-slate-200 bg-white p-3 text-left text-sm text-slate-700 shadow-sm hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6 sm:px-6" aria-live="polite">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
          <span className="inline-flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-500" />
          </span>
          Searching the documentation…
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
