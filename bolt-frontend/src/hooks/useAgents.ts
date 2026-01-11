import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Agent } from '../lib/types';

export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (projectId: string) => [...agentKeys.lists(), projectId] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...agentKeys.details(), projectId, id] as const,
};

export function useAgents(projectId?: string) {
  return useQuery({
    queryKey: agentKeys.list(projectId!),
    queryFn: async () => {
      const { data } = await apiClient.get<Agent[]>(`/${projectId}/agents`);
      return Array.isArray(data) ? data : data.items || [];
    },
    enabled: !!projectId,
  });
}

export function useAgentById(projectId?: string, agentId?: string) {
  return useQuery({
    queryKey: agentKeys.detail(projectId!, agentId!),
    queryFn: async () => {
      const { data } = await apiClient.get<Agent>(`/${projectId}/agents/${agentId}`);
      return data;
    },
    enabled: !!projectId && !!agentId,
  });
}

interface CreateAgentInput {
  role: string;
  did: string;
  status?: 'active' | 'inactive' | 'suspended';
  metadata?: Record<string, unknown>;
}

export function useCreateAgent(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAgentInput) => {
      const { data } = await apiClient.post<Agent>(`/${projectId}/agents`, input);
      return data;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) });
      }
    },
  });
}

interface UpdateAgentInput {
  role?: string;
  status?: 'active' | 'inactive' | 'suspended';
  metadata?: Record<string, unknown>;
}

export function useUpdateAgent(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, updates }: { agentId: string; updates: UpdateAgentInput }) => {
      const { data } = await apiClient.put<Agent>(`/${projectId}/agents/${agentId}`, updates);
      return data;
    },
    onSuccess: (data) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) });
        queryClient.invalidateQueries({ queryKey: agentKeys.detail(projectId, data.agent_id) });
      }
    },
  });
}

export function useDeleteAgent(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      await apiClient.delete(`/${projectId}/agents/${agentId}`);
      return agentId;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) });
      }
    },
  });
}
