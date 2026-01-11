import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ComplianceEvent } from '../lib/types';

export const complianceKeys = {
  all: ['compliance'] as const,
  lists: () => [...complianceKeys.all, 'list'] as const,
  list: (projectId: string, runId?: string) => [...complianceKeys.lists(), { projectId, runId }] as const,
  details: () => [...complianceKeys.all, 'detail'] as const,
  detail: (projectId: string, id: string) => [...complianceKeys.details(), projectId, id] as const,
};

export function useComplianceEvents(projectId?: string, runId?: string) {
  return useQuery({
    queryKey: complianceKeys.list(projectId!, runId),
    queryFn: async () => {
      const params = runId ? { run_id: runId } : {};
      const { data } = await apiClient.get<ComplianceEvent[] | { items: ComplianceEvent[] }>(`/${projectId}/compliance-events`, { params });
      return Array.isArray(data) ? data : data.items || [];
    },
    enabled: !!projectId,
  });
}

export function useComplianceEventById(projectId?: string, eventId?: string) {
  return useQuery({
    queryKey: complianceKeys.detail(projectId!, eventId!),
    queryFn: async () => {
      const { data } = await apiClient.get<ComplianceEvent>(`/${projectId}/compliance-events/${eventId}`);
      return data;
    },
    enabled: !!projectId && !!eventId,
  });
}
