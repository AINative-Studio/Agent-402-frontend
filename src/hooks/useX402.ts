import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { X402Request } from '../lib/types';

export const x402Keys = {
  all: ['x402'] as const,
  lists: () => [...x402Keys.all, 'list'] as const,
  list: (projectId: string, runId?: string) => [...x402Keys.lists(), { projectId, runId }] as const,
  details: () => [...x402Keys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...x402Keys.details(), projectId, id] as const,
};

export function useX402Requests(projectId?: string, runId?: string) {
  return useQuery({
    queryKey: x402Keys.list(projectId!, runId),
    queryFn: async () => {
      const params = runId ? { run_id: runId } : {};
      const { data } = await apiClient.get<X402Request[] | { items: X402Request[] }>(`/${projectId}/x402-requests`, { params });
      return Array.isArray(data) ? data : data.items || [];
    },
    enabled: !!projectId,
  });
}

export function useX402RequestById(projectId?: string, requestId?: string) {
  return useQuery({
    queryKey: x402Keys.detail(projectId!, requestId!),
    queryFn: async () => {
      const { data } = await apiClient.get<X402Request>(`/${projectId}/x402-requests/${requestId}`);
      return data;
    },
    enabled: !!projectId && !!requestId,
  });
}
