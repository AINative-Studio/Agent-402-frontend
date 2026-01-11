import { useState } from 'react';
import { Bot, Plus, Trash2, Loader2, AlertCircle, Edit2, Check, X } from 'lucide-react';
import { useAgents, useCreateAgent, useDeleteAgent, useUpdateAgent } from '../hooks/useAgents';
import { useProject } from '../hooks/useProject';
import type { Agent } from '../lib/types';

export function Agents() {
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id;

  const { data: agents, isLoading, error } = useAgents(projectId);
  const createMutation = useCreateAgent(projectId);
  const deleteMutation = useDeleteAgent(projectId);
  const updateMutation = useUpdateAgent(projectId);

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState({ role: '', did: '' });
  const [editRole, setEditRole] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.role.trim() || !newAgent.did.trim()) return;

    createMutation.mutate({
      role: newAgent.role,
      did: newAgent.did,
      status: 'active',
    }, {
      onSuccess: () => {
        setNewAgent({ role: '', did: '' });
        setShowCreate(false);
      },
    });
  };

  const handleDelete = (agentId: string, role: string) => {
    if (confirm(`Delete agent "${role}"?`)) {
      deleteMutation.mutate(agentId);
    }
  };

  const startEdit = (agent: Agent) => {
    setEditingId(agent.agent_id);
    setEditRole(agent.role);
  };

  const handleUpdate = (agentId: string) => {
    updateMutation.mutate({
      agentId,
      updates: { role: editRole },
    }, {
      onSuccess: () => setEditingId(null),
    });
  };

  if (!currentProject) {
    return (
      <div className="p-6 text-gray-400 text-center">
        Please select a project to view agents.
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

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load agents</span>
        </div>
      </div>
    );
  }

  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    suspended: 'bg-red-500',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-gray-400 mt-1">Manage your AI agents</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <input
                type="text"
                value={newAgent.role}
                onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                placeholder="e.g., coordinator"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">DID</label>
              <input
                type="text"
                value={newAgent.did}
                onChange={(e) => setNewAgent({ ...newAgent, did: e.target.value })}
                placeholder="did:example:123"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
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

      {agents && agents.length > 0 ? (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div
              key={agent.agent_id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-blue-400" />
                  {editingId === agent.agent_id ? (
                    <input
                      type="text"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                      autoFocus
                    />
                  ) : (
                    <span className="text-white font-medium">{agent.role}</span>
                  )}
                  <span className={`w-2 h-2 rounded-full ${statusColors[agent.status] || 'bg-gray-500'}`} />
                </div>
                <div className="flex items-center gap-2">
                  {editingId === agent.agent_id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(agent.agent_id)}
                        className="p-2 text-green-400 hover:text-green-300"
                        disabled={updateMutation.isPending}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 text-gray-400 hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(agent)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.agent_id, agent.role)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                <span className="font-mono">{agent.did}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Created: {new Date(agent.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No agents yet. Create your first agent to get started.</p>
        </div>
      )}
    </div>
  );
}
