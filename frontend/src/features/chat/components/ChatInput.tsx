import { FormEvent, KeyboardEvent, useState } from 'react';
import { QUESTION_MAX_LENGTH, QUESTION_MIN_LENGTH } from '../../../types/api';

interface ChatInputProps {
  onSend: (question: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (disabled) return;
    const question = value.trim();
    if (question.length < QUESTION_MIN_LENGTH) {
      setError(`Please enter at least ${QUESTION_MIN_LENGTH} characters.`);
      return;
    }
    setError(null);
    onSend(question);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <textarea
          id="question"
          rows={1}
          value={value}
          maxLength={QUESTION_MAX_LENGTH}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          placeholder="Ask a question about the docs…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'question-error' : 'question-hint'}
          className="max-h-40 min-h-11 flex-1 resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled}
          className="h-11 shrink-0 rounded-xl bg-brand-600 px-4 font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? 'Asking…' : 'Ask'}
        </button>
      </div>
      <div className="mx-auto mt-1 flex max-w-3xl justify-between text-xs">
        {error ? (
          <p id="question-error" role="alert" className="text-red-600">
            {error}
          </p>
        ) : (
          <p id="question-hint" className="text-slate-400">
            Enter to send · Shift+Enter for a new line
          </p>
        )}
        <span className="text-slate-400">
          {value.length}/{QUESTION_MAX_LENGTH}
        </span>
      </div>
    </form>
  );
}
