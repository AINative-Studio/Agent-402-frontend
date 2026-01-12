import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { AgentMemory, PaginatedResponse, SearchResponse } from '../lib/types';

export const memoryKeys = {
  all: ['memory'] as const,
  lists: () => [...memoryKeys.all, 'list'] as const,
  list: (projectId: string, filters?: { agentId?: string; runId?: string; role?: string; limit?: number; offset?: number }) =>
    [...memoryKeys.lists(), { projectId, ...filters }] as const,
  details: () => [...memoryKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...memoryKeys.details(), projectId, id] as const,
};

interface MemoryFilters {
  agentId?: string;
  runId?: string;
  role?: string;
  limit?: number;
  offset?: number;
}

export function useMemories(projectId?: string, filters?: MemoryFilters) {
  return useQuery({
    queryKey: memoryKeys.list(projectId!, filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.agentId) params.agent_id = filters.agentId;
      if (filters?.runId) params.run_id = filters.runId;
      if (filters?.role) params.role = filters.role;
      if (filters?.limit) params.limit = String(filters.limit);
      if (filters?.offset) params.offset = String(filters.offset);

      const { data } = await apiClient.get<AgentMemory[] | PaginatedResponse<AgentMemory>>(`/${projectId}/agent-memory`, { params });

      // Handle both paginated and array responses
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          limit: filters?.limit || data.length,
          offset: filters?.offset || 0,
        };
      }

      return {
        items: data.items || [],
        total: data.total || 0,
        limit: data.limit || filters?.limit || 20,
        offset: data.offset || filters?.offset || 0,
      };
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

export function useMemoryByStep(projectId?: string, runId?: string, step?: string) {
  return useQuery({
    queryKey: [...memoryKeys.list(projectId!, { runId }), 'step', step] as const,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (runId) params.run_id = runId;

      const { data } = await apiClient.get<AgentMemory[] | { items: AgentMemory[] }>(`/${projectId}/agent-memory`, { params });
      const memories = Array.isArray(data) ? data : data.items || [];

      // Filter memories by workflow step if step is provided
      if (!step) return memories;

      return memories.filter((memory) => {
        const metadata = memory.metadata as { workflow_step?: string } | undefined;
        return metadata?.workflow_step === step;
      });
    },
    enabled: !!projectId && !!runId,
  });
}

interface MemorySearchInput {
    projectId: string;
    query: string;
    namespace?: string;
    threshold?: number;
    limit?: number;
}

export function useMemorySearch() {
    return useMutation({
        mutationFn: async (input: MemorySearchInput) => {
            const { data } = await apiClient.post<SearchResponse>(
                `/${input.projectId}/embeddings/search`,
                {
                    query_text: input.query,
                    namespace: input.namespace || 'agent-memory',
                    limit: input.limit || 10,
                    threshold: input.threshold || 0.7,
                    model: 'BAAI/bge-small-en-v1.5',
                }
            );
            return data;
        },
    });
}
