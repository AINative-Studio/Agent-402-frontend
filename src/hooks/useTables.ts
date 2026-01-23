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

// Delete table with confirmation
export function useDeleteTable(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableId, confirm = true }: { tableId: string; confirm?: boolean }) => {
      await apiClient.delete(`/${projectId}/tables/${tableId}`, {
        params: { confirm },
      });
      return tableId;
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.lists(projectId) });
      }
    },
  });
}

// List rows with pagination support
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

// Query rows with full response (for pagination)
export function useQueryRows(projectId?: string, tableId?: string, params?: {
  limit?: number;
  offset?: number;
  filter?: Record<string, unknown>;
  sort?: Record<string, unknown>;
}) {
  return useQuery({
    queryKey: [...tableKeys.rows(projectId!, tableId!), params],
    queryFn: async () => {
      const { data } = await apiClient.get<{ rows: Row[]; total: number; limit: number; offset: number }>(
        `/${projectId}/tables/${tableId}/rows`,
        { params }
      );
      return data;
    },
    enabled: !!projectId && !!tableId,
  });
}

// Alias for useTableById with better naming
export function useGetTable(projectId?: string, tableId?: string) {
  return useTableById(projectId, tableId);
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
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: tableKeys.rows(projectId!, tableId!) });
    },
    onSuccess: () => {
      if (projectId && tableId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
        queryClient.invalidateQueries({ queryKey: tableKeys.detail(projectId, tableId) });
      }
    },
    onError: () => {
      // Rollback on error by invalidating queries
      if (projectId && tableId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
      }
    },
  });
}

// Update single row
export function useUpdateRow(projectId?: string, tableId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rowId, rowData }: { rowId: string; rowData: Record<string, unknown> }) => {
      const { data } = await apiClient.put<Row>(
        `/${projectId}/tables/${tableId}/rows/${rowId}`,
        { row_data: rowData }
      );
      return data;
    },
    onMutate: async ({ rowId, rowData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: tableKeys.rows(projectId!, tableId!) });
      await queryClient.cancelQueries({ queryKey: tableKeys.row(projectId!, tableId!, rowId) });

      // Snapshot the previous value
      const previousRows = queryClient.getQueryData(tableKeys.rows(projectId!, tableId!));
      const previousRow = queryClient.getQueryData(tableKeys.row(projectId!, tableId!, rowId));

      // Optimistically update the row cache
      queryClient.setQueryData(tableKeys.row(projectId!, tableId!, rowId), (old: Row | undefined) => {
        if (!old) return old;
        return {
          ...old,
          row_data: rowData,
          data: rowData,
        };
      });

      // Return context with snapshot
      return { previousRows, previousRow };
    },
    onSuccess: (data, variables) => {
      if (projectId && tableId) {
        // Invalidate the rows list
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
        // Update the specific row cache with server response
        queryClient.setQueryData(tableKeys.row(projectId, tableId, variables.rowId), data);
      }
    },
    onError: (_error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousRow && projectId && tableId) {
        queryClient.setQueryData(tableKeys.row(projectId, tableId, variables.rowId), context.previousRow);
      }
      if (projectId && tableId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
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
    onMutate: async (rowId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: tableKeys.rows(projectId!, tableId!) });

      // Snapshot the previous value
      const previousRows = queryClient.getQueryData(tableKeys.rows(projectId!, tableId!));

      // Optimistically remove the row from cache
      queryClient.setQueryData(
        tableKeys.rows(projectId!, tableId!),
        (old: Row[] | undefined) => {
          if (!old) return old;
          return old.filter((row) => row.row_id !== rowId);
        }
      );

      return { previousRows };
    },
    onSuccess: () => {
      if (projectId && tableId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
        queryClient.invalidateQueries({ queryKey: tableKeys.detail(projectId, tableId) });
      }
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousRows && projectId && tableId) {
        queryClient.setQueryData(tableKeys.rows(projectId, tableId), context.previousRows);
      }
    },
  });
}

// Delete multiple rows (bulk delete)
export function useBulkDeleteRows(projectId?: string, tableId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowIds: string[]) => {
      // Delete rows in parallel
      const deletePromises = rowIds.map((rowId) =>
        apiClient.delete(`/${projectId}/tables/${tableId}/rows/${rowId}`)
      );
      const results = await Promise.allSettled(deletePromises);

      // Count successful deletions
      const successCount = results.filter((result) => result.status === 'fulfilled').length;
      const failedCount = results.filter((result) => result.status === 'rejected').length;

      return {
        success: successCount,
        failed: failedCount,
        total: rowIds.length,
      };
    },
    onSuccess: () => {
      if (projectId && tableId) {
        queryClient.invalidateQueries({ queryKey: tableKeys.rows(projectId, tableId) });
        queryClient.invalidateQueries({ queryKey: tableKeys.detail(projectId, tableId) });
      }
    },
  });
}
