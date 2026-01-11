import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Key, Database, Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { getRunStats } from '../lib/api';
import type { RunStats } from '../lib/types';

export function Overview() {
  const [stats, setStats] = useState<RunStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getRunStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-[var(--surface)] rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-[var(--surface)] rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-[var(--surface)] border border-[var(--danger)]/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--danger)] mt-0.5" />
              <div>
                <h3 className="font-semibold text-[var(--danger)] mb-1">Error Loading Data</h3>
                <p className="text-sm text-[var(--muted)]">{error}</p>
                <button
                  onClick={loadStats}
                  className="mt-4 px-4 py-2 bg-[var(--danger)] text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_runs === 0) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Runs Yet</h2>
            <p className="text-[var(--muted)] mb-6">Execute the CLI demo to generate workflow data</p>
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Latest Run Status',
      value: stats.latest_run?.status || 'N/A',
      icon: CheckCircle,
      color: 'success',
    },
    {
      label: 'X402 Requests',
      value: stats.total_x402_requests.toString(),
      icon: Key,
      color: 'primary',
    },
    {
      label: 'Memory Entries',
      value: stats.total_memory_entries.toString(),
      icon: Database,
      color: 'warning',
    },
    {
      label: 'Compliance Events',
      value: stats.total_compliance_events.toString(),
      icon: Shield,
      color: 'success',
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--success)]/10 border border-[var(--border)] rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2">Auditable Fintech Agent Workflow</h1>
          <p className="text-lg text-[var(--muted)] mb-6">CrewAI × X402 × ZeroDB</p>
          <p className="text-[var(--muted)] mb-6 max-w-3xl">
            This demo showcases a multi-agent workflow with cryptographically signed requests,
            persistent memory, and compliance tracking. All actions are auditable and deterministically replayable.
          </p>
          {stats.latest_run && (
            <Link
              to={`/runs/${stats.latest_run.run_id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              View Latest Run
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-[var(--${card.color})]/10 rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-[var(--${card.color})]`} />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">{card.value}</div>
                <div className="text-sm text-[var(--muted)]">{card.label}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-[var(--primary)]" />
                X402 Signing
              </h3>
              <p className="text-sm text-[var(--muted)]">
                All agent requests are cryptographically signed and verified using decentralized identifiers
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--warning)]" />
                Persistent Memory
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Agent memory is preserved across runs for improved decision-making and auditability
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--success)]" />
                Compliance Tracking
              </h3>
              <p className="text-sm text-[var(--muted)]">
                Every action is logged with risk assessment and compliance verification
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
