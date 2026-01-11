import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { AgentMemory } from '../lib/types';

export const memoryKeys = {
  all: ['memory'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (projectId: string, filters?: { agentId?: string; runId?: string }) =>
    [...memoryKeys.lists(), { projectId, ...filters }] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...memoryKeys.details(), projectId, id] as const,
  search: (projectId: string, query: string) => [...memoryKeys.all, 'search', projectId, query] as const,
};

export function useMemories(projectId?: string, filters?: { agentId?: string; runId?: string }) {
  return useQuery({
    queryKey: memoryKeys.list(projectId!, filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.agentId) params.agent_id = filters.agentId;
      if (filters?.runId) params.run_id = filters.runId;
      const { data } = await apiClient.get<AgentMemory[]>(`/${projectId}/memory`, { params });
      return Array.isArray(data) ? data : data.items || [];
    },
    enabled: !!projectId,
  });
}

export function useMemoryById(projectId?: string, memoryId?: string) {
  return useQuery({
    queryKey: memoryKeys.detail(projectId!, memoryId!),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentMemory>(`/${projectId}/memory/${memoryId}`);
      return data;
    },
    enabled: !!projectId && !!memoryId,
  });
}

interface StoreMemoryInput {
  content: string;
  agentId: string;
  runId?: string;
  namespace?: string;
  metadata?: Record<string, unknown>;
}

export function useStoreMemory(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: StoreMemoryInput) => {
      const { data } = await apiClient.post<AgentMemory>(`/${projectId}/memory`, {
        content: input.content,
        agent_id: input.agentId,
        run_id: input.runId,
        namespace: input.namespace || 'default',
        metadata: input.metadata,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.lists() });
    },
  });
}

interface SearchMemoryInput {
  query: string;
  limit?: number;
  threshold?: number;
}

export function useSearchMemory(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SearchMemoryInput) => {
      const { data } = await apiClient.post<AgentMemory[]>(`/${projectId}/memory/search`, {
        query: input.query,
        limit: input.limit || 10,
        threshold: input.threshold || 0.7,
      });
      return Array.isArray(data) ? data : data.results || [];
    },
  });
}
