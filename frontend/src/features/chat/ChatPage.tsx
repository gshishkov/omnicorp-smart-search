import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { useChat } from './hooks/useChat';

export function ChatPage() {
  const { messages, send, clear, isPending } = useChat();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <MessageList messages={messages} isPending={isPending} onExample={send} />
      </div>
      {messages.length > 0 && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-1 text-right sm:px-6">
          <button type="button" onClick={clear} disabled={isPending} className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50">
            Clear conversation
          </button>
        </div>
      )}
      <ChatInput onSend={send} disabled={isPending} />
    </div>
  );
}
