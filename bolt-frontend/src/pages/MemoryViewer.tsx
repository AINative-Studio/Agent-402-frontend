import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Database, Brain, AlertCircle } from 'lucide-react';
import { useMemories } from '../hooks/useMemory';
import { useProject } from '../hooks/useProject';
import type { AgentMemory } from '../lib/types';

export function MemoryViewer() {
  const { runId } = useParams<{ runId: string }>();
  const { currentProject } = useProject();
  const [filter, setFilter] = useState<string>('all');

  const { data: memories = [], isLoading, error } = useMemories(
    currentProject?.project_id,
    { runId }
  );

  const roles = ['all', ...Array.from(new Set(memories.map(m => m.agent_role).filter(Boolean)))];
  const filteredMemories = filter === 'all'
    ? memories
    : memories.filter(m => m.agent_role === filter);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'analyst':
        return 'primary';
      case 'compliance':
        return 'success';
      case 'transaction':
        return 'warning';
      default:
        return 'muted';
    }
  };

  if (!currentProject) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <p className="text-[var(--muted)]">No project selected</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-[var(--surface)] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <p className="text-[var(--danger)] mb-2">Failed to load memories</p>
            <p className="text-[var(--muted)] text-sm">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Agent Memory</h2>
            <p className="text-[var(--muted)]">Persistent memory entries across agent execution</p>
          </div>

          <div className="flex gap-2">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === role
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredMemories.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <Database className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <p className="text-[var(--muted)]">No memory entries found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredMemories.map((memory) => {
              const roleColor = getRoleColor(memory.agent_role || 'unknown');
              return (
                <div
                  key={memory.memory_id || memory.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--${roleColor})]/10`}>
                      <Brain className={`w-6 h-6 text-[var(--${roleColor})]`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold capitalize">
                          {memory.agent_role ? `${memory.agent_role} Agent` : 'Agent'}
                        </h3>
                        {memory.confidence_score && (
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
                            {(memory.confidence_score * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                      {(memory.summary || memory.content) && (
                        <p className="text-sm text-[var(--muted)] mb-3">
                          {memory.summary || memory.content.substring(0, 200)}
                        </p>
                      )}
                      <div className="text-xs text-[var(--subtle)]">
                        {new Date(memory.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <details className="bg-[var(--surface-2)] rounded-xl p-4">
                    <summary className="text-sm font-medium cursor-pointer select-none">
                      View Full Details
                    </summary>
                    <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto">
                      {JSON.stringify(memory.details || memory.metadata || memory, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
