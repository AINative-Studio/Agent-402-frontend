import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { Table, TableSchema, Row } from '../lib/types';

export const tableKeys = {
  all: ['tables'] as const,
  lists: (projectId: string) => [...tableKeys.all, 'list', projectId] as const,
  detail: (projectId: string, tableId: string) => [...tableKeys.all, 'detail', projectId, tableId] as const,
  rows: (projectId: string, tableId: string) => [...tableKeys.all, 'rows', projectId, tableId] as const,
  row: (projectId: string, tableId: string, rowId: string) => [...tableKeys.all, 'row', projectId, tableId, rowId] as const,
};

interface TableListResponse {
  tables: Table[];
  total: number;
}

// List all tables
export function useTables(projectId?: string) {
  return useQuery({
    queryKey: tableKeys.lists(projectId!),
    queryFn: async () => {
      const { data } = await apiClient.get<TableListResponse>(`/${projectId}/tables`);
      return data.tables || [];
    },
    enabled: !!projectId,
  });
}

// Get single table
export function useTableById(projectId?: string, tableId?: string) {
  return useQuery({
    queryKey: tableKeys.detail(projectId!, tableId!),
    queryFn: async () => {
      const { data } = await apiClient.get<Table>(`/${projectId}/tables/${tableId}`);
      return data;
    },
    enabled: !!projectId && !!tableId,
  });
}

// Create table
export function useCreateTable(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { table_name: string; description?: string; schema: TableSchema }) => {
      const { data } = await apiClient.post<Table>(`/${projectId}/tables`, input);
      return data;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.lists(projectId) });
      }
    },
  });
}

// Delete table
export function useDeleteTable(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tableId: string) => {
      await apiClient.delete(`/${projectId}/tables/${tableId}`);
      return tableId;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.lists(projectId) });
      }
    },
  });
}

// List rows
export function useTableRows(projectId?: string, tableId?: string, params?: {
  limit?: number;
  offset?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}) {
  return useQuery({
    queryKey: [...tableKeys.rows(projectId!, tableId!), params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ items: Row[]; total: number; limit: number; offset: number }>(
        `/${projectId}/tables/${tableId}/rows`,
        { params }
      );
      return data.items || [];
    },
    enabled: !!projectId && !!tableId,
  });
}

// Get single row
export function useRowById(projectId?: string, tableId?: string, rowId?: string) {
  return useQuery({
    queryKey: tableKeys.row(projectId!, tableId!, rowId!),
    queryFn: async () => {
      const { data } = await apiClient.get<Row>(`/${projectId}/tables/${tableId}/rows/${rowId}`);
      return data;
    },
    enabled: !!projectId && !!tableId && !!rowId,
  });
}

// Insert rows
export function useInsertRows(projectId?: string, tableId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (row_data: Record<string, unknown> | Record<string, unknown>[]) => {
      const { data } = await apiClient.post<{ inserted_count: number; rows: Array<{ id: string; created_at: string }> }>(
        `/${projectId}/tables/${tableId}/rows`,
        { row_data }
      );
      return data;
    },
    onSuccess: () => {
      if (projectId && tableId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
        queryClient.invalidateQueries({ queryKey: tableKeys.detail(projectId, tableId) });
      }
    },
  });
}

// Delete single row
export function useDeleteRow(projectId?: string, tableId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowId: string) => {
      const { data } = await apiClient.delete<{ id: string; deleted: boolean; deleted_at: string }>(
        `/${projectId}/tables/${tableId}/rows/${rowId}`
      );
      return data;
    },
    onSuccess: () => {
      if (projectId && tableId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
        queryClient.invalidateQueries({ queryKey: tableKeys.detail(projectId, tableId) });
      }
    },
  });
}
