import { useParams, Link, useLocation } from 'react-router-dom';
import { Clock, CheckCircle, Key, Database, Shield, Activity } from 'lucide-react';
import { useRunById } from '../hooks/useRuns';
import { useX402Requests } from '../hooks/useX402';
import { useComplianceEvents } from '../hooks/useCompliance';
import { useMemories } from '../hooks/useMemory';
import { useProject } from '../hooks/useProject';

export function RunDetail() {
  const { runId } = useParams<{ runId: string }>();
  const location = useLocation();
  const { currentProject } = useProject();

  const { data: run, isLoading: runLoading, error: runError } = useRunById(currentProject?.id, runId);
  const { data: x402Requests = [], isLoading: x402Loading } = useX402Requests(currentProject?.id, runId);
  const { data: memory = [], isLoading: memoryLoading } = useMemories(currentProject?.id, { runId });
  const { data: compliance = [], isLoading: complianceLoading } = useComplianceEvents(currentProject?.id, runId);

  const loading = runLoading || x402Loading || memoryLoading || complianceLoading;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const tabs = [
    { path: '', label: 'Timeline', icon: Activity },
    { path: '/x402', label: 'X402 Requests', icon: Key },
    { path: '/memory', label: 'Memory', icon: Database },
    { path: '/audit', label: 'Compliance', icon: Shield },
  ];

  const currentTab = tabs.find(tab => location.pathname.endsWith(tab.path)) || tabs[0];

  if (!currentProject) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
            <p className="text-[var(--muted)]">Please select a project to view run details</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-[var(--surface)] rounded-2xl" />
            <div className="h-96 bg-[var(--surface)] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (runError) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
            <p className="text-red-500 mb-2">Error loading run details</p>
            <p className="text-sm text-[var(--muted)]">{runError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const timelineSteps = [
    {
      title: 'Analyst Agent',
      description: 'Market evaluation and analysis',
      status: 'completed',
      time: memory.find(m => m.agent_role === 'analyst')?.created_at,
      data: memory.find(m => m.agent_role === 'analyst'),
    },
    {
      title: 'Compliance Agent',
      description: 'Risk assessment and regulatory checks',
      status: 'completed',
      time: compliance[0]?.created_at,
      data: compliance[0],
    },
    {
      title: 'Transaction Agent',
      description: 'Signed request generation',
      status: 'completed',
      time: x402Requests.find(r => r.did.includes('transaction'))?.created_at,
      data: x402Requests.find(r => r.did.includes('transaction')),
    },
    {
      title: 'Server Verification',
      description: 'Signature verification and validation',
      status: 'completed',
      time: x402Requests[0]?.created_at,
      data: x402Requests[0],
    },
    {
      title: 'ZeroDB Persistence',
      description: 'Data persisted to immutable storage',
      status: 'completed',
      time: x402Requests[x402Requests.length - 1]?.created_at,
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-mono mb-2">{runId}</h1>
              <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  {x402Requests.length} Requests
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {memory.length} Memories
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {compliance.length} Events
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-[var(--success)]/10 text-[var(--success)] text-sm font-medium">
              Completed
            </div>
          </div>

          <nav className="flex gap-2 border-t border-[var(--border)] pt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab === currentTab;
              return (
                <Link
                  key={tab.path}
                  to={`/runs/${runId}${tab.path}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">Execution Timeline</h2>
          <div className="space-y-6">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    step.status === 'completed'
                      ? 'bg-[var(--success)]/10'
                      : 'bg-[var(--surface-2)]'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-[var(--success)]" />
                    ) : (
                      <Clock className="w-6 h-6 text-[var(--muted)]" />
                    )}
                  </div>
                  {index < timelineSteps.length - 1 && (
                    <div className="w-0.5 h-16 bg-[var(--border)] my-2" />
                  )}
                </div>

                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    {step.time && (
                      <span className="text-sm text-[var(--muted)] font-mono">
                        {formatTime(step.time)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] mb-3">{step.description}</p>

                  {step.data && (
                    <details className="bg-[var(--surface-2)] rounded-xl p-4">
                      <summary className="text-sm font-medium cursor-pointer select-none">
                        View Details
                      </summary>
                      <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
