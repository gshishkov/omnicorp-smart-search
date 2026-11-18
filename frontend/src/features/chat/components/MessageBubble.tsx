import type { ChatMessage } from '../types';
import { AnswerText } from './AnswerText';
import { CitationList } from './CitationList';

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-white sm:max-w-[70%]">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div role="alert" className="max-w-[95%] rounded-2xl rounded-bl-sm border border-red-200 bg-red-50 px-4 py-3 text-red-800 sm:max-w-[80%]">
        <p className="font-medium">Request failed</p>
        <p className="text-sm">{message.content}</p>
      </div>
    );
  }

  if (message.refused) {
    return (
      <div
        data-testid="refusal"
        className="max-w-[95%] rounded-2xl rounded-bl-sm border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:max-w-[80%]"
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Not found in documentation</p>
        <p>{message.content}</p>
      </div>
    );
  }

  return (
    <article className="max-w-[95%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm sm:max-w-[80%]">
      <AnswerText text={message.content} citations={message.citations ?? []} messageId={message.id} />
      <CitationList citations={message.citations ?? []} messageId={message.id} />
    </article>
  );
}
