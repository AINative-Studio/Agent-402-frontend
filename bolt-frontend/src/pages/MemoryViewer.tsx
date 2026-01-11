import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Database, Brain } from 'lucide-react';
import { getAgentMemoryByRun } from '../lib/api';
import type { AgentMemory } from '../lib/types';

export function MemoryViewer() {
  const { runId } = useParams<{ runId: string }>();
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (runId) {
      loadMemories();
    }
  }, [runId]);

  const loadMemories = async () => {
    if (!runId) return;

    try {
      setLoading(true);
      const data = await getAgentMemoryByRun(runId);
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const roles = ['all', ...Array.from(new Set(memories.map(m => m.agent_role)))];
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

  if (loading) {
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
              const roleColor = getRoleColor(memory.agent_role);
              return (
                <div
                  key={memory.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--${roleColor})]/10`}>
                      <Brain className={`w-6 h-6 text-[var(--${roleColor})]`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold capitalize">{memory.agent_role} Agent</h3>
                        {memory.confidence_score && (
                          <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--success)]/10 text-[var(--success)]">
                            {(memory.confidence_score * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--muted)] mb-3">{memory.summary}</p>
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
                      {JSON.stringify(memory.details, null, 2)}
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
