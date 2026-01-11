import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Run } from '../lib/types';

// Query keys
export const runKeys = {
  all: ['runs'] as const,
  lists: () => [...runKeys.all, 'list'] as const,
  list: (projectId: string) => [...runKeys.lists(), projectId] as const,
  details: () => [...runKeys.all, 'detail'] as const,
  detail: (runId: string) => [...runKeys.details(), runId] as const,
};

// Fetch all runs for a project
export function useRuns(projectId: string | undefined) {
  return useQuery({
    queryKey: runKeys.list(projectId!),
    queryFn: async () => {
      const { data } = await apiClient.get<{ items?: Run[]; data?: Run[] }>(`/${projectId}/runs`);
      return data.items || data.data || [];
    },
    enabled: !!projectId,
  });
}

// Fetch single run
export function useRunById(projectId: string | undefined, runId: string | undefined) {
  return useQuery({
    queryKey: runKeys.detail(runId!),
    queryFn: async () => {
      const { data } = await apiClient.get<Run>(`/${projectId}/runs/${runId}`);
      return data;
    },
    enabled: !!projectId && !!runId,
  });
}
