import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table2, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useTables, useCreateTable, useDeleteTable } from '../hooks/useTables';

export function Tables() {
  const { data: tables, isLoading, error } = useTables();
  const createMutation = useCreateTable();
  const deleteMutation = useDeleteTable();

  const [showCreate, setShowCreate] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDesc, setNewTableDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    createMutation.mutate({
      name: newTableName,
      description: newTableDesc,
      schema: {
        fields: {},
        indexes: [],
      },
    }, {
      onSuccess: () => {
        setNewTableName('');
        setNewTableDesc('');
        setShowCreate(false);
      },
    });
  };

  const handleDelete = (tableId: string, tableName: string) => {
    if (confirm(`Delete table "${tableName}"? This cannot be undone.`)) {
      deleteMutation.mutate(tableId);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
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
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Table
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Table Name</label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="my_table"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
            <input
              type="text"
              value={newTableDesc}
              onChange={(e) => setNewTableDesc(e.target.value)}
              placeholder="Table description..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !newTableName.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {tables && tables.length > 0 ? (
        <div className="grid gap-4">
          {tables.map((table) => (
            <div
              key={table.table_id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between"
            >
              <Link
                to={`/tables/${table.table_id}`}
                className="flex items-center gap-3 hover:text-blue-400 transition-colors"
              >
                <Table2 className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-white font-medium">{table.name}</div>
                  {table.description && (
                    <div className="text-sm text-gray-400">{table.description}</div>
                  )}
                  <div className="text-xs text-gray-500">{table.row_count || 0} rows</div>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(table.table_id, table.name)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Table2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tables yet. Create your first table to get started.</p>
        </div>
      )}
    </div>
  );
}
