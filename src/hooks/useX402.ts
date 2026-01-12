import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { X402RequestWithLinks, X402RequestListResponse, X402RequestStatus } from '../lib/types';

export interface X402RequestFilters {
  agent_id?: string;
  task_id?: string;
  run_id?: string;
  status?: X402RequestStatus;
  limit?: number;
  offset?: number;
}

export const x402Keys = {
  all: ['x402'] as const,
  lists: () => [...x402Keys.all, 'list'] as const,
  list: (projectId: string, filters?: X402RequestFilters) => [...x402Keys.lists(), { projectId, filters }] as const,
  details: () => [...x402Keys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...x402Keys.details(), projectId, id] as const,
};

export function useX402Requests(projectId?: string, filters?: X402RequestFilters) {
  return useQuery({
    queryKey: x402Keys.list(projectId!, filters),
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters?.agent_id) params.agent_id = filters.agent_id;
      if (filters?.task_id) params.task_id = filters.task_id;
      if (filters?.run_id) params.run_id = filters.run_id;
      if (filters?.status) params.status = filters.status;
      if (filters?.limit !== undefined) params.limit = filters.limit;
      if (filters?.offset !== undefined) params.offset = filters.offset;

      const { data } = await apiClient.get<X402RequestListResponse>(`/v1/public/${projectId}/x402-requests`, { params });
      return data;
    },
    enabled: !!projectId,
  });
}

export function useX402RequestById(projectId?: string, requestId?: string) {
  return useQuery({
    queryKey: x402Keys.detail(projectId!, requestId!),
    queryFn: async () => {
      const { data } = await apiClient.get<X402RequestWithLinks>(`/v1/public/${projectId}/x402-requests/${requestId}`);
      return data;
    },
    enabled: !!projectId && !!requestId,
  });
}
