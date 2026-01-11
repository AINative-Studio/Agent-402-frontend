import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { AgentMemory } from '../lib/types';

export const memoryKeys = {
  all: ['memory'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (projectId: string, filters?: { agentId?: string; runId?: string }) =>
    [...memoryKeys.lists(), { projectId, ...filters }] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...memoryKeys.details(), projectId, id] as const,
};

export function useMemories(projectId?: string, filters?: { agentId?: string; runId?: string }) {
  return useQuery({
    queryKey: memoryKeys.list(projectId!, filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.agentId) params.agent_id = filters.agentId;
      if (filters?.runId) params.run_id = filters.runId;

      const { data } = await apiClient.get<AgentMemory[] | { items: AgentMemory[] }>(`/${projectId}/agent-memory`, { params });
      return Array.isArray(data) ? data : data.items || [];
    },
    enabled: !!projectId,
  });
}

export function useMemoryById(projectId?: string, memoryId?: string) {
  return useQuery({
    queryKey: memoryKeys.detail(projectId!, memoryId!),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentMemory>(`/${projectId}/agent-memory/${memoryId}`);
      return data;
    },
    enabled: !!projectId && !!memoryId,
  });
}
