import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from '../lib/types';

export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (projectId: string) => [...agentKeys.lists(), projectId] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...agentKeys.details(), projectId, id] as const,
};

interface AgentListResponse {
  items?: Agent[];
  data?: Agent[];
  agents?: Agent[];
}

interface AgentResponse {
  agent?: Agent;
  data?: Agent;
}

export function useAgents(projectId?: string) {
  return useQuery({
    queryKey: agentKeys.list(projectId!),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentListResponse>(`/v1/public/agents?project_id=${projectId}`);
      return data.items || data.agents || data.data || [];
    },
    enabled: !!projectId,
  });
}

export function useAgentById(projectId?: string, agentId?: string) {
  return useQuery({
    queryKey: agentKeys.detail(projectId!, agentId!),
    queryFn: async () => {
      const { data } = await apiClient.get<AgentResponse>(`/v1/public/agents/${agentId}`);
      return data.agent || data.data || data;
    },
    enabled: !!projectId && !!agentId,
  });
}

export function useCreateAgent(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateAgentRequest, 'project_id'>) => {
      const payload: CreateAgentRequest = {
        ...input,
        project_id: projectId!,
        scope: input.scope || 'PROJECT',
      };
      const { data } = await apiClient.post<AgentResponse>('/v1/public/agents', payload);
      return data.agent || data.data || data;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) });
      }
    },
  });
}

export function useUpdateAgent(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentId, updates }: { agentId: string; updates: UpdateAgentRequest }) => {
      const { data } = await apiClient.patch<AgentResponse>(`/v1/public/agents/${agentId}`, updates);
      return data.agent || data.data || data;
    },
    onSuccess: (_data, variables) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) });
        if (variables.agentId) {
          queryClient.invalidateQueries({ queryKey: agentKeys.detail(projectId, variables.agentId) });
        }
      }
    },
  });
}

export function useDeleteAgent(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      await apiClient.delete(`/v1/public/agents/${agentId}`);
      return agentId;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: agentKeys.list(projectId) });
      }
    },
  });
}
