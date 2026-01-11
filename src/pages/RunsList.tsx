import { Link } from 'react-router-dom';
import { PlayCircle, Key, Database, Shield, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { useRuns } from '../hooks/useRuns';
import { useProject } from '../hooks/useProject';

export function RunsList() {
  const { currentProject } = useProject();
  const { data: runs = [], isLoading, error } = useRuns(currentProject?.project_id);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      default:
        return 'primary';
    }
  };

  // Handle no project selected
  if (!currentProject) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Project Selected</h2>
            <p className="text-[var(--muted)]">Please select a project to view runs</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle loading state
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

  // Handle error state
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[var(--danger)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[var(--danger)]" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Error Loading Runs</h2>
            <p className="text-[var(--muted)]">{error instanceof Error ? error.message : 'Failed to load runs'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Runs Yet</h2>
            <p className="text-[var(--muted)]">Execute the CLI demo to generate workflow data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Workflow Runs</h1>
          <p className="text-[var(--muted)]">Select a run to view detailed execution timeline and data</p>
        </div>

        <div className="space-y-4">
          {runs.map((run) => {
            const statusColor = getStatusColor(run.status);
            return (
              <Link
                key={run.run_id}
                to={`/runs/${run.run_id}`}
                className="block bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)]/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold font-mono">{run.run_id}</h3>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-[var(--${statusColor})]/10 text-[var(--${statusColor})]`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <Calendar className="w-4 h-4" />
                      {run.created_at ? formatDate(run.created_at) : 'N/A'}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--muted)]" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                      <Key className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{run.x402_count}</div>
                      <div className="text-xs text-[var(--muted)]">X402 Requests</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--warning)]/10 rounded-xl flex items-center justify-center">
                      <Database className="w-5 h-5 text-[var(--warning)]" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{run.memory_count}</div>
                      <div className="text-xs text-[var(--muted)]">Memory Entries</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--success)]/10 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[var(--success)]" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold">{run.compliance_count}</div>
                      <div className="text-xs text-[var(--muted)]">Compliance Events</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
