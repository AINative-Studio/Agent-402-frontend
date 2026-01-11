import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Table, TableSchema, Row } from '../lib/types';

function getProjectId(): string {
  return localStorage.getItem('projectId') || 'default';
}

interface CreateTableInput {
  name: string;
  description?: string;
  schema: TableSchema;
}

interface CreateTableResponse {
  table_id: string;
  project_id: string;
  name: string;
  description?: string;
  schema: TableSchema;
  row_count: number;
  created_at: string;
}

export function useTables() {
  const projectId = getProjectId();

  return useQuery({
    queryKey: ['tables', projectId],
    queryFn: async () => {
      const response = await apiClient.get<{ items: Table[] }>(`/${projectId}/tables`);
      return response.data.items || response.data || [];
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();
  const projectId = getProjectId();

  return useMutation({
    mutationFn: async (input: CreateTableInput) => {
      const { data } = await apiClient.post<CreateTableResponse>(`/${projectId}/tables`, {
        name: input.name,
        description: input.description,
        schema: input.schema,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', projectId] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  const projectId = getProjectId();

  return useMutation({
    mutationFn: async (tableId: string) => {
      await apiClient.delete(`/${projectId}/tables/${tableId}`, {
        params: { confirm: true },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', projectId] });
    },
  });
}

export function useTableById(tableId?: string) {
  const projectId = getProjectId();

  return useQuery({
    queryKey: ['table', tableId],
    queryFn: async () => {
      if (!tableId) return null;
      const { data } = await apiClient.get<Table>(`/${projectId}/tables/${tableId}`);
      return data;
    },
    enabled: !!tableId,
  });
}

export function useTableRows(tableId?: string) {
  const projectId = getProjectId();

  return useQuery({
    queryKey: ['table-rows', tableId],
    queryFn: async () => {
      if (!tableId) return [];
      const { data } = await apiClient.get<{ items: Row[] }>(`/${projectId}/tables/${tableId}/rows`);
      return data.items || [];
    },
    enabled: !!tableId,
  });
}

export function useInsertRows(tableId?: string) {
  const queryClient = useQueryClient();
  const projectId = getProjectId();

  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]) => {
      if (!tableId) throw new Error('Table ID is required');
      const { data } = await apiClient.post(`/${projectId}/tables/${tableId}/rows`, { rows });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-rows', tableId] });
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
    },
  });
}

export function useDeleteRows(tableId?: string) {
  const queryClient = useQueryClient();
  const projectId = getProjectId();

  return useMutation({
    mutationFn: async (filter: { row_id: string }) => {
      if (!tableId) throw new Error('Table ID is required');
      const { data } = await apiClient.delete(`/${projectId}/tables/${tableId}/rows`, {
        data: { filter },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table-rows', tableId] });
      queryClient.invalidateQueries({ queryKey: ['table', tableId] });
    },
  });
}
