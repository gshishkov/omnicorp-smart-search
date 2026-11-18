import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export const DOCUMENTS_KEY = ['documents'] as const;

export function useDocuments() {
  return useQuery({ queryKey: DOCUMENTS_KEY, queryFn: api.listDocuments });
}

export function useReloadDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.reloadDocuments,
    onSuccess: () => qc.invalidateQueries({ queryKey: DOCUMENTS_KEY }),
  });
}
