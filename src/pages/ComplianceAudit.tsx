import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useComplianceEvents } from '../hooks/useCompliance';
import { useProject } from '../hooks/useProject';
import type { ComplianceEvent } from '../lib/types';

export function ComplianceAudit() {
  const { runId } = useParams<{ runId: string }>();
  const { currentProject } = useProject();
  const { data: events = [], isLoading, error } = useComplianceEvents(currentProject?.project_id, runId);

  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: 'LOW', color: 'success' };
    if (score < 60) return { label: 'MEDIUM', color: 'warning' };
    return { label: 'HIGH', color: 'danger' };
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 bg-[var(--surface)] rounded-2xl" />
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
            <XCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <p className="text-[var(--danger)] mb-2">Failed to load compliance events</p>
            <p className="text-sm text-[var(--muted)]">{error instanceof Error ? error.message : 'An error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Compliance Audit</h2>
          <p className="text-[var(--muted)]">Risk assessment and regulatory compliance events</p>
        </div>

        {events.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <Shield className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <p className="text-[var(--muted)]">No compliance events found for this run</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const riskLevel = getRiskLevel(event.risk_score);
              return (
                <div
                  key={event.event_id || event.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      event.passed
                        ? 'bg-[var(--success)]/10'
                        : 'bg-[var(--danger)]/10'
                    }`}>
                      {event.passed ? (
                        <CheckCircle className="w-6 h-6 text-[var(--success)]" />
                      ) : (
                        <XCircle className="w-6 h-6 text-[var(--danger)]" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold">
                          {event.passed ? 'Compliance Check Passed' : 'Compliance Check Failed'}
                        </h3>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-[var(--${event.passed ? 'success' : 'danger'})]/10 text-[var(--${event.passed ? 'success' : 'danger'})]`}>
                          {event.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-[var(--muted)] mb-1">Risk Score</div>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">{event.risk_score.toFixed(1)}</div>
                            <span className={`px-2 py-1 rounded text-xs font-medium bg-[var(--${riskLevel.color})]/10 text-[var(--${riskLevel.color})]`}>
                              {riskLevel.label}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-[var(--muted)] mb-1">Timestamp</div>
                          <div className="text-sm font-mono">
                            {new Date(event.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-[var(--muted)] mb-1">Reason Codes</div>
                          <div className="text-sm">
                            {event.reason_codes?.length || 0} checks
                          </div>
                        </div>
                      </div>

                      {event.reason_codes && event.reason_codes.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-[var(--muted)] mb-2">Checks Performed</div>
                          <div className="flex flex-wrap gap-2">
                            {event.reason_codes.map((code, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--surface-2)] text-[var(--text)]"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <details className="bg-[var(--surface-2)] rounded-xl p-4">
                        <summary className="text-sm font-medium cursor-pointer select-none">
                          View Full Details
                        </summary>
                        <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {events.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[var(--warning)] mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">About Compliance Tracking</h3>
                <p className="text-sm text-[var(--muted)]">
                  All agent actions are evaluated for regulatory compliance. Risk scores below 30 are considered low risk,
                  30-60 medium risk, and above 60 high risk. Each event includes reason codes indicating which compliance
                  checks were performed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
