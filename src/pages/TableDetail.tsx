import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Database,
  Edit
} from 'lucide-react';
import { useTableById, useQueryRows, useInsertRows, useUpdateRow, useDeleteRow, useBulkDeleteRows } from '../hooks/useTables';
import { useProject } from '../hooks/useProject';
import { useToast } from '../contexts/ToastContext';
import { SchemaViewer } from '../components/SchemaViewer';
import { RowEditor } from '../components/RowEditor';
import { ConfirmModal } from '../components/ConfirmModal';
import { SkeletonBase, SkeletonTable } from '../components/skeletons';
import type { FieldValue } from '../lib/types';

interface RowToEdit {
    rowId: string;
    data: Record<string, FieldValue>;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function TableDetail() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id;
  const toast = useToast();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('');

  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [editingRow, setEditingRow] = useState<RowToEdit | null>(null);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Fetch data
  const { data: table, isLoading: tableLoading } = useTableById(projectId, tableId);
  const { data: rowsResponse, isLoading: rowsLoading, refetch } = useQueryRows(
    projectId,
    tableId,
    {
      limit: pageSize,
      offset: currentPage * pageSize,
    }
  );

  const insertMutation = useInsertRows(projectId, tableId);
  const updateMutation = useUpdateRow(projectId, tableId);
  const deleteMutation = useDeleteRow(projectId, tableId);
  const bulkDeleteMutation = useBulkDeleteRows(projectId, tableId);

  // Extract schema fields for search filtering
  const schemaFields = useMemo(() => {
    if (!table?.schema?.fields) return [];
    return Object.keys(table.schema.fields);
  }, [table]);

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!rowsResponse?.rows) return [];
    if (!searchTerm) return rowsResponse.rows;

    return rowsResponse.rows.filter((row) => {
      const rowData = row.row_data || row.data || {};

      // Search in specific field if selected
      if (searchField) {
        const fieldValue = rowData[searchField];
        if (fieldValue === null || fieldValue === undefined) return false;
        return String(fieldValue).toLowerCase().includes(searchTerm.toLowerCase());
      }

      // Search across all fields
      return Object.values(rowData).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [rowsResponse?.rows, searchTerm, searchField]);

  // Pagination calculations
  const totalRows = rowsResponse?.total || 0;
  const totalPages = Math.ceil(totalRows / pageSize);
  const hasMore = (rowsResponse?.total || 0) > (currentPage + 1) * pageSize;

  const handleCreateRow = (data: Record<string, FieldValue>) => {
    insertMutation.mutate([data], {
      onSuccess: () => {
        setShowEditor(false);
        toast.success('Row created successfully');
        refetch();
      },
      onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
        const errorMessage = error.response?.data?.detail || 'Failed to create row';
        toast.error(errorMessage);
      },
    });
  };

  const handleUpdateRow = (data: Record<string, FieldValue>) => {
    if (!editingRow) return;

    updateMutation.mutate(
      { rowId: editingRow.rowId, rowData: data },
      {
        onSuccess: () => {
          setEditingRow(null);
          setShowEditor(false);
          toast.success('Row updated successfully');
          refetch();
        },
        onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
          const errorMessage = error.response?.data?.detail || 'Failed to update row';
          toast.error(errorMessage);
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!rowToDelete) return;

    deleteMutation.mutate(rowToDelete, {
      onSuccess: () => {
        setRowToDelete(null);
        toast.success('Row deleted successfully');
        refetch();
      },
      onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
        const errorMessage = error.response?.data?.detail || 'Failed to delete row';
        toast.error(errorMessage);
        setRowToDelete(null);
      },
    });
  };

  const handleEdit = (rowId: string, data: Record<string, FieldValue>) => {
    setEditingRow({ rowId, data });
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingRow(null);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleViewRow = (rowId: string) => {
    navigate(`/tables/${tableId}/rows/${rowId}`);
  };

  const handleToggleRow = (rowId: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (selectedRows.size === filteredRows.length && filteredRows.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredRows.map((row) => row.row_id)));
    }
  };

  const handleBulkDeleteConfirm = () => {
    const rowIds = Array.from(selectedRows);
    if (rowIds.length === 0) return;

    bulkDeleteMutation.mutate(rowIds, {
      onSuccess: (result) => {
        setShowBulkDeleteConfirm(false);
        setSelectedRows(new Set());
        if (result.failed > 0) {
          toast.warning(
            `Deleted ${result.success} of ${result.total} rows. ${result.failed} failed.`
          );
        } else {
          toast.success(`Successfully deleted ${result.success} rows`);
        }
        refetch();
      },
      onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
        const errorMessage = error.response?.data?.detail || 'Failed to delete rows';
        toast.error(errorMessage);
        setShowBulkDeleteConfirm(false);
      },
    });
  };

  if (!currentProject) {
    return (
      <div className="p-6 text-gray-400 text-center">
        Please select a project to view table details.
      </div>
    );
  }

  if (tableLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-4">
          <SkeletonBase width={20} height={20} />
          <div className="flex-1">
            <SkeletonBase height={32} width="40%" className="mb-2" />
            <SkeletonBase height={16} width="60%" />
          </div>
          <SkeletonBase height={20} width={150} />
        </div>

        {/* Schema Skeleton */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <SkeletonBase height={20} width="30%" className="mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonBase key={i} height={16} width="80%" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Table not found</span>
        </div>
      </div>
    );
  }

  const hasSchema = table.schema?.fields && Object.keys(table.schema.fields).length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/tables" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{table.table_name || table.name}</h1>
          {table.description && (
            <p className="text-gray-400 mt-1">{table.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Database className="w-4 h-4" />
          <span className="font-medium text-blue-400">{totalRows}</span>
          <span>total rows</span>
        </div>
      </div>

      {/* Schema Section */}
      {table.schema && <SchemaViewer schema={table.schema} />}

      {/* Action Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search rows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {schemaFields.length > 0 && (
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All fields</option>
              {schemaFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          {selectedRows.size > 0 && (
            <button
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={bulkDeleteMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selectedRows.size} Selected
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              setEditingRow(null);
              setShowEditor(true);
            }}
            disabled={!hasSchema}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            title={!hasSchema ? 'Please define a schema first' : 'Create new row'}
          >
            <Plus className="w-4 h-4" />
            Create Row
          </button>
        </div>
      </div>

      {/* Schema Warning */}
      {!hasSchema && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="text-sm text-yellow-300">
            No schema defined for this table. Please define a schema to enable structured row creation and editing.
          </div>
        </div>
      )}

      {/* Rows List */}
      {rowsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filteredRows && filteredRows.length > 0 ? (
        <>
          {/* Select All Header */}
          {filteredRows.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredRows.length && filteredRows.length > 0}
                  onChange={handleToggleAll}
                  className="rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">
                  {selectedRows.size > 0
                    ? `${selectedRows.size} of ${filteredRows.length} selected`
                    : 'Select all'}
                </span>
              </label>
            </div>
          )}

          <div className="space-y-3">
            {filteredRows.map((row) => {
              const rowData = row.row_data || row.data || {};
              const isSelected = selectedRows.has(row.row_id);
              return (
                <div
                  key={row.row_id}
                  className={`bg-gray-800 rounded-lg p-4 border transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(row.row_id)}
                        className="mt-1 rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">ID:</span>
                          <code className="text-xs text-gray-400 font-mono">{row.row_id}</code>
                          {row.created_at && (
                            <>
                              <span className="text-gray-600">|</span>
                              <span className="text-xs text-gray-500">
                                {new Date(row.created_at).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                        <pre className="text-sm text-white whitespace-pre-wrap break-words overflow-x-auto bg-gray-900/50 p-3 rounded border border-gray-700">
                          {JSON.stringify(rowData, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {hasSchema && (
                        <button
                          onClick={() => handleEdit(row.row_id, rowData as Record<string, FieldValue>)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit row"
                          disabled={updateMutation.isPending}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleViewRow(row.row_id)}
                        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-700 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRowToDelete(row.row_id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        disabled={deleteMutation.isPending}
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-gray-400">
                Showing {currentPage * pageSize + 1}-
                {Math.min((currentPage + 1) * pageSize, totalRows)} of {totalRows}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-3 py-1 bg-gray-800 rounded border border-gray-700">
                <span className="text-sm text-white">
                  Page {currentPage + 1} of {totalPages || 1}
                </span>
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages - 1 || !hasMore}
                className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">
            {searchTerm ? 'No matching rows found' : 'No rows in this table'}
          </p>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search' : 'Insert your first row to get started'}
          </p>
        </div>
      )}

      {/* Row Editor Modal */}
      {showEditor && hasSchema && (
        <RowEditor
          isOpen={showEditor}
          onClose={handleCloseEditor}
          onSubmit={editingRow ? handleUpdateRow : handleCreateRow}
          schema={table.schema}
          initialData={editingRow?.data}
          mode={editingRow ? 'edit' : 'create'}
          isLoading={insertMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={rowToDelete !== null}
        onClose={() => setRowToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Row"
        message="Are you sure you want to delete this row? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDeleteConfirm}
        title="Delete Multiple Rows"
        message={`Are you sure you want to delete ${selectedRows.size} selected row${selectedRows.size > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={`Delete ${selectedRows.size} Row${selectedRows.size > 1 ? 's' : ''}`}
        cancelText="Cancel"
        variant="danger"
        isLoading={bulkDeleteMutation.isPending}
      />
    </div>
  );
}
