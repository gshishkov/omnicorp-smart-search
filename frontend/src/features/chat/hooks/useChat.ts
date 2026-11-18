import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { api } from '../../../lib/api';
import { ApiError } from '../../../lib/http';
import type { ChatMessage } from '../types';

/** Chat state: local message history + one in-flight request at a time. */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextId = useRef(0);
  const { mutate, isPending } = useMutation({ mutationFn: api.chat });

  const newId = () => `m${++nextId.current}`;

  const send = useCallback(
    (question: string) => {
      setMessages((m) => [...m, { id: newId(), role: 'user', content: question }]);
      mutate(
        { question },
        {
          onSuccess: (res) =>
            setMessages((m) => [
              ...m,
              { id: newId(), role: 'assistant', content: res.answer, citations: res.citations, refused: res.refused },
            ]),
          onError: (err) =>
            setMessages((m) => [
              ...m,
              {
                id: newId(),
                role: 'assistant',
                error: true,
                content: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
              },
            ]),
        },
      );
    },
    [mutate],
  );

  const clear = useCallback(() => setMessages([]), []);

  return { messages, send, clear, isPending };
}
