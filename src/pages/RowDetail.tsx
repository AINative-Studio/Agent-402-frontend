import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2, AlertCircle, Calendar, Database, Edit } from 'lucide-react';
import { useRowById, useDeleteRow, useUpdateRow, useTableById } from '../hooks/useTables';
import { useProject } from '../hooks/useProject';
import { useToast } from '../contexts/ToastContext';
import { RowEditor } from '../components/RowEditor';
import { ConfirmModal } from '../components/ConfirmModal';
import type { FieldValue } from '../lib/types';

export function RowDetail() {
  const { tableId, rowId } = useParams<{ tableId: string; rowId: string }>();
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id;
  const toast = useToast();

  const [showEditor, setShowEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: row, isLoading, refetch } = useRowById(projectId, tableId, rowId);
  const { data: table } = useTableById(projectId, tableId);
  const deleteMutation = useDeleteRow(projectId, tableId);
  const updateMutation = useUpdateRow(projectId, tableId);

  const handleDelete = () => {
    deleteMutation.mutate(rowId!, {
      onSuccess: () => {
        toast.success('Row deleted successfully');
        navigate(`/tables/${tableId}`);
      },
      onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
        const errorMessage = error.response?.data?.detail || 'Failed to delete row';
        toast.error(errorMessage);
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleUpdate = (data: Record<string, FieldValue>) => {
    updateMutation.mutate(
      { rowId: rowId!, rowData: data },
      {
        onSuccess: () => {
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

  if (!currentProject) {
    return (
      <div className="p-6 text-gray-400 text-center">
        Please select a project to view row details.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!row) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Row not found</span>
        </div>
      </div>
    );
  }

  const rowData = row.row_data || row.data || {};
  const hasSchema = table?.schema?.fields && Object.keys(table.schema.fields).length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/tables/${tableId}`}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Row Details</h1>
            <p className="text-gray-400 mt-1">
              <code className="text-sm">{row.row_id}</code>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasSchema && (
            <button
              onClick={() => setShowEditor(true)}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Row
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Row
          </button>
        </div>
      </div>

      {/* Metadata Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-400">Row ID</div>
              <code className="text-white font-mono text-sm">{row.row_id}</code>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-gray-400">Table ID</div>
              <code className="text-white font-mono text-sm">{row.table_id}</code>
            </div>
          </div>
          {row.created_at && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm text-gray-400">Created At</div>
                <div className="text-white text-sm">
                  {new Date(row.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {row.updated_at && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm text-gray-400">Updated At</div>
                <div className="text-white text-sm">
                  {new Date(row.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row Data Section */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Row Data</h2>

        {/* Formatted view */}
        <div className="space-y-3 mb-6">
          {Object.entries(rowData).map(([key, value]) => (
            <div
              key={key}
              className="flex items-start gap-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600"
            >
              <div className="flex-shrink-0 min-w-[120px]">
                <code className="text-sm text-blue-400 font-mono">{key}</code>
              </div>
              <div className="flex-1 min-w-0">
                {typeof value === 'object' && value !== null ? (
                  <pre className="text-sm text-white whitespace-pre-wrap break-words overflow-x-auto bg-gray-900/50 p-2 rounded border border-gray-700">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <div className="text-sm text-white break-words">
                    {value === null ? (
                      <span className="text-gray-500 italic">null</span>
                    ) : value === undefined ? (
                      <span className="text-gray-500 italic">undefined</span>
                    ) : typeof value === 'boolean' ? (
                      <span className={value ? 'text-green-400' : 'text-red-400'}>
                        {String(value)}
                      </span>
                    ) : typeof value === 'number' ? (
                      <span className="text-yellow-400">{value}</span>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Raw JSON view */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Raw JSON</h3>
          <pre className="text-sm text-white whitespace-pre-wrap break-words overflow-x-auto bg-gray-900/50 p-4 rounded border border-gray-700">
            {JSON.stringify(rowData, null, 2)}
          </pre>
        </div>
      </div>

      {/* Row Editor Modal */}
      {showEditor && hasSchema && table?.schema && (
        <RowEditor
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          onSubmit={handleUpdate}
          schema={table.schema}
          initialData={rowData as Record<string, FieldValue>}
          mode="edit"
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Row"
        message="Are you sure you want to delete this row? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
