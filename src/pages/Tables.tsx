import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table2, Plus, Trash2, Loader2, AlertCircle, Database, Calendar } from 'lucide-react';
import { useTables, useCreateTable, useDeleteTable } from '../hooks/useTables';
import { useProject } from '../hooks/useProject';
import { CreateTableModal } from '../components/CreateTableModal';
import { SkeletonListCard } from '../components/skeletons';
import type { TableSchema } from '../lib/types';

export function Tables() {
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id;

  const { data: tables, isLoading, error } = useTables(projectId);
  const createMutation = useCreateTable(projectId);
  const deleteMutation = useDeleteTable(projectId);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateTable = (data: { table_name: string; description?: string; schema: TableSchema }) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowCreateModal(false);
      },
    });
  };

  const handleDelete = (tableId: string, tableName: string) => {
    if (confirm(`Delete table "${tableName}"? This cannot be undone.`)) {
      deleteMutation.mutate({ tableId, confirm: true });
    }
  };

  if (!currentProject) {
    return (
      <div className="p-6 text-gray-400 text-center">
        Please select a project to view tables.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tables</h1>
            <p className="text-gray-400 mt-1">Manage your NoSQL tables</p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 opacity-50 text-white rounded-lg cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Table
          </button>
        </div>
        <SkeletonListCard items={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load tables</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tables</h1>
          <p className="text-gray-400 mt-1">Manage your NoSQL tables</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Table
        </button>
      </div>

      {tables && tables.length > 0 ? (
        <div className="grid gap-4">
          {tables.map((table) => (
            <div
              key={table.table_id}
              className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <Link
                to={`/tables/${table.table_id}`}
                className="block p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Table2 className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-lg">{table.name}</h3>
                      </div>

                      {table.description && (
                        <p className="text-sm text-gray-400 mb-3">{table.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Database className="w-4 h-4" />
                          <span className="font-medium text-blue-400">{table.row_count || 0}</span>
                          <span>rows</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="text-gray-500">Fields:</span>
                          <span className="font-medium text-gray-300">
                            {Object.keys(table.schema?.fields || {}).length}
                          </span>
                        </div>

                        {table.schema?.indexes && table.schema.indexes.length > 0 && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <span className="text-gray-500">Indexes:</span>
                            <span className="font-medium text-gray-300">
                              {table.schema.indexes.length}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-gray-500 text-xs ml-auto">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(table.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {Object.keys(table.schema?.fields || {}).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-500 mb-2">Schema Preview</div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(table.schema.fields).slice(0, 5).map(([fieldName, fieldDef]) => (
                              <span
                                key={fieldName}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 rounded text-xs"
                              >
                                <span className="text-gray-300">{fieldName}</span>
                                <span className="text-gray-500">:</span>
                                <span className="text-blue-400">{fieldDef.type}</span>
                                {fieldDef.required && (
                                  <span className="text-red-400">*</span>
                                )}
                              </span>
                            ))}
                            {Object.keys(table.schema.fields).length > 5 && (
                              <span className="inline-flex items-center px-2 py-1 text-xs text-gray-500">
                                +{Object.keys(table.schema.fields).length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(table.table_id ?? table.id, table.name ?? table.table_name);
                    }}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors ml-4 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
          <Table2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No tables yet</p>
          <p className="text-sm text-gray-500">Create your first table to get started</p>
        </div>
      )}

      <CreateTableModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTable}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
