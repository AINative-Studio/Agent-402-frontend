import { useState } from 'react';
import { Bot, Plus, Trash2, Loader2, AlertCircle, Edit2, Power, PowerOff } from 'lucide-react';
import { useAgents, useDeleteAgent, useUpdateAgent } from '../hooks/useAgents';
import { useProject } from '../hooks/useProject';
import { useToast } from '../contexts/ToastContext';
import { CreateAgentModal } from '../components/CreateAgentModal';
import { UpdateAgentModal } from '../components/UpdateAgentModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { SkeletonListCard } from '../components/skeletons';
import type { Agent } from '../lib/types';
import { formatDID } from '../lib/didUtils';

export function Agents() {
  const { currentProject } = useProject();
  const projectId = currentProject?.project_id;
  const toast = useToast();

  const { data: agents, isLoading, error } = useAgents(projectId);
  const deleteMutation = useDeleteAgent(projectId);
  const updateMutation = useUpdateAgent(projectId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleUpdateClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowUpdateModal(true);
  };

  const handleDeleteClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAgent) return;

    try {
      await deleteMutation.mutateAsync(selectedAgent.agent_id);
      setShowDeleteModal(false);
      setSelectedAgent(null);
      toast.success('Agent deleted successfully');
    } catch (error) {
      toast.error('Failed to delete agent');
      console.error('Failed to delete agent:', error);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';

    try {
      await updateMutation.mutateAsync({
        agentId: agent.agent_id,
        updates: {
          role: agent.role,
          name: agent.name,
          description: agent.description,
          scope: agent.scope,
        },
      });

      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update agent status');
      console.error('Failed to toggle agent status:', error);
    }
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Agents</h1>
            <p className="text-gray-400 mt-1">Manage your AI agents</p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 opacity-50 text-white rounded-lg cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Create Agent
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

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    suspended: 'Suspended',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agents</h1>
          <p className="text-gray-400 mt-1">Manage your AI agents</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </div>

      {agents && agents.length > 0 ? (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div
              key={agent.agent_id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-lg">{agent.name || agent.role}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          agent.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : agent.status === 'suspended'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {statusLabels[agent.status]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">Role:</span>
                      <span className="text-gray-300">{agent.role}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">DID:</span>
                      <span className="text-gray-300 font-mono text-xs" title={agent.did}>
                        {formatDID(agent.did)}
                      </span>
                    </div>
                    {agent.description && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 w-20">Description:</span>
                        <span className="text-gray-400 flex-1">{agent.description}</span>
                      </div>
                    )}
                    {agent.scope && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-20">Scope:</span>
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          {agent.scope}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">Created:</span>
                      <span className="text-gray-400 text-xs">
                        {new Date(agent.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* Toggle Status Button */}
                  <button
                    onClick={() => handleToggleStatus(agent)}
                    className={`p-2 rounded transition-colors ${
                      agent.status === 'active'
                        ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-gray-500/10'
                    }`}
                    title={agent.status === 'active' ? 'Deactivate agent' : 'Activate agent'}
                    disabled={updateMutation.isPending || agent.status === 'suspended'}
                  >
                    {agent.status === 'active' ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleUpdateClick(agent)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                    title="Edit agent"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteClick(agent)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete agent"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No agents yet</p>
          <p className="text-sm">Create your first agent to get started.</p>
        </div>
      )}

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Update Agent Modal */}
      <UpdateAgentModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        projectId={projectId}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAgent(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Agent"
        message={`Are you sure you want to delete "${selectedAgent?.name || selectedAgent?.role}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
