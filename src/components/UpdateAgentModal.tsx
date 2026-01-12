import { useState, useEffect, FormEvent } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { useUpdateAgent } from '../hooks/useAgents';
import type { Agent, AgentScope } from '../lib/types';

interface UpdateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
  projectId?: string;
}

const ROLE_OPTIONS = [
  { value: 'Financial Analyst', label: 'Financial Analyst' },
  { value: 'Compliance Officer', label: 'Compliance Officer' },
  { value: 'Transaction Executor', label: 'Transaction Executor' },
  { value: 'Custom', label: 'Custom' },
];

const SCOPE_OPTIONS: { value: AgentScope; label: string; description: string }[] = [
  { value: 'SYSTEM', label: 'System', description: 'System-wide agent' },
  { value: 'PROJECT', label: 'Project', description: 'Project-scoped agent' },
  { value: 'RUN', label: 'Run', description: 'Run-scoped agent' },
];

export function UpdateAgentModal({ isOpen, onClose, agent, projectId }: UpdateAgentModalProps) {
  const updateMutation = useUpdateAgent(projectId);

  const [formData, setFormData] = useState({
    role: '',
    customRole: '',
    name: '',
    description: '',
    scope: 'PROJECT' as AgentScope,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when agent changes
  useEffect(() => {
    if (agent) {
      const isCustomRole = !ROLE_OPTIONS.some(opt => opt.value === agent.role && opt.value !== 'Custom');

      setFormData({
        role: isCustomRole ? 'Custom' : agent.role,
        customRole: isCustomRole ? agent.role : '',
        name: agent.name || '',
        description: agent.description || '',
        scope: agent.scope || 'PROJECT',
      });
      setErrors({});
    }
  }, [agent]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Role validation
    const effectiveRole = formData.role === 'Custom' ? formData.customRole : formData.role;
    if (!effectiveRole.trim()) {
      newErrors.role = 'Role is required';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!agent || !validateForm()) {
      return;
    }

    const effectiveRole = formData.role === 'Custom' ? formData.customRole : formData.role;

    try {
      await updateMutation.mutateAsync({
        agentId: agent.agent_id,
        updates: {
          role: effectiveRole,
          name: formData.name,
          description: formData.description || undefined,
          scope: formData.scope,
        },
      });

      handleClose();
    } catch (error) {
      console.error('Failed to update agent:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      role: '',
      customRole: '',
      name: '',
      description: '',
      scope: 'PROJECT',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Update Agent</h2>
            <p className="text-sm text-gray-400 mt-1 font-mono">{agent.did}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Dropdown */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={`w-full px-4 py-2 bg-gray-700 border ${
                errors.role ? 'border-red-500' : 'border-gray-600'
              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Select a role</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <div className="mt-1 flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.role}</span>
              </div>
            )}
          </div>

          {/* Custom Role Input (shown when Custom is selected) */}
          {formData.role === 'Custom' && (
            <div>
              <label htmlFor="customRole" className="block text-sm font-medium text-gray-300 mb-2">
                Custom Role <span className="text-red-400">*</span>
              </label>
              <input
                id="customRole"
                type="text"
                value={formData.customRole}
                onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                placeholder="Enter custom role"
                className={`w-full px-4 py-2 bg-gray-700 border ${
                  errors.role ? 'border-red-500' : 'border-gray-600'
                } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          )}

          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Agent name"
              maxLength={100}
              className={`w-full px-4 py-2 bg-gray-700 border ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {errors.name && (
              <div className="mt-1 flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.name}</span>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">{formData.name.length}/100 characters</p>
          </div>

          {/* Description Textarea */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Agent description (optional)"
              rows={3}
              maxLength={500}
              className={`w-full px-4 py-2 bg-gray-700 border ${
                errors.description ? 'border-red-500' : 'border-gray-600'
              } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            />
            {errors.description && (
              <div className="mt-1 flex items-center gap-1 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.description}</span>
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">{formData.description.length}/500 characters</p>
          </div>

          {/* Scope Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scope <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: option.value })}
                  className={`p-3 rounded-lg border transition-colors ${
                    formData.scope === option.value
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs mt-1 opacity-80">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message from API */}
          {updateMutation.isError && (
            <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Failed to update agent. Please try again.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Agent'
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={updateMutation.isPending}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
