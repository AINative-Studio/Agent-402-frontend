import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Run, RunStats } from '../lib/types';

// Query keys
export const runKeys = {
  all: ['runs'] as const,
  lists: () => [...runKeys.all, 'list'] as const,
  list: (projectId?: string) => [...runKeys.lists(), { projectId }] as const,
  details: () => [...runKeys.all, 'detail'] as const,
  detail: (id: string) => [...runKeys.details(), id] as const,
  stats: (id: string) => [...runKeys.detail(id), 'stats'] as const,
};

// Fetch all runs for a project
export function useRuns(projectId?: string) {
  return useQuery({
    queryKey: runKeys.list(projectId),
    queryFn: async () => {
      const params = projectId ? { project_id: projectId } : {};
      const { data } = await apiClient.get<Run[]>('/runs', { params });
      return data;
    },
    enabled: !!projectId,
  });
}

// Fetch single run
export function useRunById(runId: string | undefined) {
  return useQuery({
    queryKey: runKeys.detail(runId!),
    queryFn: async () => {
      const { data } = await apiClient.get<Run>(`/runs/${runId}`);
      return data;
    },
    enabled: !!runId,
  });
}

// Fetch run stats
export function useRunStats(runId: string | undefined) {
  return useQuery({
    queryKey: runKeys.stats(runId!),
    queryFn: async () => {
      const { data } = await apiClient.get<RunStats>(`/runs/${runId}/stats`);
      return data;
    },
    enabled: !!runId,
  });
}

// Fetch overview stats for a project
export function useProjectStats(projectId?: string) {
  return useQuery({
    queryKey: ['projectStats', projectId],
    queryFn: async () => {
      const { data } = await apiClient.get<RunStats>(`/projects/${projectId}/stats`);
      return data;
    },
    enabled: !!projectId,
  });
}
