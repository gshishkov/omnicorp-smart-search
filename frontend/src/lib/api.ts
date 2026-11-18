import type { ChatRequest, ChatResponse, DocumentMetadata, ReloadResult } from '../types/api';
import { apiFetch } from './http';

export const api = {
  chat: (body: ChatRequest) => apiFetch<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify(body) }),
  listDocuments: () => apiFetch<DocumentMetadata[]>('/documents'),
  reloadDocuments: () => apiFetch<ReloadResult>('/documents/reload', { method: 'POST' }),
};
