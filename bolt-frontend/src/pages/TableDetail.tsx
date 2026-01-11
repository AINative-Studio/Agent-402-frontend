import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useTableById, useTableRows, useInsertRows, useDeleteRow } from '../hooks/useTables';
import { useProject } from '../hooks/useProject';

export function TableDetail() {
  const { tableId } = useParams<{ tableId: string }>();
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id;

  const { data: table, isLoading: tableLoading } = useTableById(projectId, tableId);
  const { data: rows, isLoading: rowsLoading, refetch } = useTableRows(projectId, tableId);
  const insertMutation = useInsertRows(projectId, tableId);
  const deleteMutation = useDeleteRow(projectId, tableId);

  const [showInsert, setShowInsert] = useState(false);
  const [newRowJson, setNewRowJson] = useState('{}');
  const [jsonError, setJsonError] = useState('');

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError('');

    try {
      const rowData = JSON.parse(newRowJson);
      insertMutation.mutate([rowData], {
        onSuccess: () => {
          setNewRowJson('{}');
          setShowInsert(false);
        },
      });
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  const handleDeleteRow = (rowId: string) => {
    if (confirm('Delete this row?')) {
      deleteMutation.mutate(rowId);
    }
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
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/tables" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{table.name}</h1>
          {table.description && (
            <p className="text-gray-400">{table.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          {rows?.length || 0} rows
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowInsert(!showInsert)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Insert Row
          </button>
        </div>
      </div>

      {showInsert && (
        <form onSubmit={handleInsert} className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Row Data (JSON)</label>
            <textarea
              value={newRowJson}
              onChange={(e) => setNewRowJson(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {jsonError && <p className="text-red-400 text-sm mt-1">{jsonError}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={insertMutation.isPending}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
            >
              {insertMutation.isPending ? 'Inserting...' : 'Insert'}
            </button>
            <button
              type="button"
              onClick={() => setShowInsert(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {rowsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : rows && rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.row_id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-2">ID: {row.row_id}</div>
                  <pre className="text-sm text-white whitespace-pre-wrap break-words overflow-x-auto">
                    {JSON.stringify(row.data, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => handleDeleteRow(row.row_id)}
                  className="ml-4 p-2 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          No rows in this table. Insert your first row to get started.
        </div>
      )}
    </div>
  );
}
