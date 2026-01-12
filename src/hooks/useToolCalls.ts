import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ToolCallEvent } from '../lib/types';

interface EventListResponse {
    events: ToolCallEvent[];
    total: number;
    limit: number;
    offset: number;
}

export const toolCallKeys = {
    all: ['toolCalls'] as const,
    lists: () => [...toolCallKeys.all, 'list'] as const,
    list: (projectId: string, runId?: string) =>
        [...toolCallKeys.lists(), projectId, runId] as const,
};

export function useToolCalls(
    projectId: string | undefined,
    runId?: string | undefined
) {
    return useQuery({
        queryKey: toolCallKeys.list(projectId!, runId),
        queryFn: async () => {
            const params: Record<string, string> = {
                event_type: 'agent_tool_call',
                limit: '1000',
            };

            if (runId) {
                params.run_id = runId;
            }

            const { data } = await apiClient.get<EventListResponse>(
                `/${projectId}/events`,
                { params }
            );

            return data.events || [];
        },
        enabled: !!projectId,
    });
}
