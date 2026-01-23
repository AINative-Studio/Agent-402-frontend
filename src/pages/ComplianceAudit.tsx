import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Filter, Download, Clock, TrendingUp } from 'lucide-react';
import { useComplianceEvents } from '../hooks/useCompliance';
import { useProject } from '../hooks/useProject';
import { appConfig } from '../config/app.config';
import type { ComplianceEvent } from '../lib/types';

type Event = ComplianceEvent;
type RiskFilter = 'all' | 'low' | 'medium' | 'high';
type StatusFilter = 'all' | 'passed' | 'failed';

export function ComplianceAudit() {
  const { runId } = useParams<{ runId: string }>();
  const { currentProject } = useProject();
  const { data: events = [], isLoading, error } = useComplianceEvents(currentProject?.project_id, runId);

  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getRiskLevel = (score: number) => {
    const level = appConfig.helpers.getRiskLevel(score);
    const value = score < appConfig.riskThresholds.low.max ? 'low' :
                  score < appConfig.riskThresholds.medium.max ? 'medium' : 'high';
    return { ...level, value: value as 'low' | 'medium' | 'high' };
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event: Event) => {
      const riskLevel = getRiskLevel(event.risk_score);

      const matchesRisk = riskFilter === 'all' || riskLevel.value === riskFilter;
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'passed' && event.passed) ||
        (statusFilter === 'failed' && !event.passed);

      return matchesRisk && matchesStatus;
    });
  }, [events, riskFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = events.length;
    const passed = events.filter((e: Event) => e.passed).length;
    const failed = total - passed;
    const lowRisk = events.filter((e: Event) => e.risk_score < 30).length;
    const mediumRisk = events.filter((e: Event) => e.risk_score >= 30 && e.risk_score < 60).length;
    const highRisk = events.filter((e: Event) => e.risk_score >= 60).length;
    const avgRiskScore = total > 0 ? events.reduce((sum: number, e: Event) => sum + e.risk_score, 0) / total : 0;

    return { total, passed, failed, lowRisk, mediumRisk, highRisk, avgRiskScore };
  }, [events]);

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Status', 'Risk Score', 'Risk Level', 'Event Type', 'Reason Codes'];
    const rows = filteredEvents.map((event: Event) => {
      const riskLevel = getRiskLevel(event.risk_score);
      return [
        new Date(event.created_at).toISOString(),
        event.passed ? 'PASSED' : 'FAILED',
        event.risk_score.toFixed(2),
        riskLevel.label,
        event.event_type || 'compliance_check',
        (event.reason_codes || []).join('; ')
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-audit-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const exportData = filteredEvents.map((event: Event) => ({
      timestamp: event.created_at,
      status: event.passed ? 'PASSED' : 'FAILED',
      risk_score: event.risk_score,
      risk_level: getRiskLevel(event.risk_score).label,
      event_type: event.event_type,
      reason_codes: event.reason_codes,
      details: event.details
    }));

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-audit-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Compliance Audit</h2>
            <p className="text-[var(--muted)]">Risk assessment and regulatory compliance events</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--surface-2)] transition-all"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(riskFilter !== 'all' || statusFilter !== 'all') && (
                <span className="px-2 py-0.5 bg-[var(--primary)] text-white text-xs rounded-full">
                  {[riskFilter !== 'all' ? 1 : 0, statusFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b)}
                </span>
              )}
            </button>

            {filteredEvents.length > 0 && (
              <div className="relative">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary)]/90 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            )}

            {filteredEvents.length > 0 && (
              <button
                onClick={exportToJSON}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-medium hover:bg-[var(--surface-2)] transition-all"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-3">Risk Level</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'low', 'medium', 'high'] as RiskFilter[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setRiskFilter(level)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        riskFilter === level
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Status</label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'passed', 'failed'] as StatusFilter[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        statusFilter === status
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Total Events</div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Passed</div>
                  <div className="text-2xl font-bold">{stats.passed}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">
                {stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : 0}% pass rate
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--danger)]/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-[var(--danger)]" />
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Failed</div>
                  <div className="text-2xl font-bold">{stats.failed}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">
                {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}% fail rate
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[var(--warning)]" />
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Avg Risk Score</div>
                  <div className="text-2xl font-bold">{stats.avgRiskScore.toFixed(1)}</div>
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                <div className="flex-1 text-center">
                  <div className="text-xs text-[var(--success)]">{stats.lowRisk}</div>
                  <div className="text-xs text-[var(--muted)]">Low</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-[var(--warning)]">{stats.mediumRisk}</div>
                  <div className="text-xs text-[var(--muted)]">Med</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-[var(--danger)]">{stats.highRisk}</div>
                  <div className="text-xs text-[var(--muted)]">High</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <appConfig.emptyStates.noCompliance.icon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
            <p className="text-[var(--muted)]">{appConfig.emptyStates.noCompliance.message}</p>
          </div>
        ) : (
          <>
            {filteredEvents.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
                <Shield className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <p className="text-[var(--muted)]">No events match the selected filters</p>
                <button
                  onClick={() => {
                    setRiskFilter('all');
                    setStatusFilter('all');
                  }}
                  className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary)]/90"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-[var(--primary)]" />
                    <h3 className="font-semibold">Compliance Timeline</h3>
                    <span className="ml-auto text-sm text-[var(--muted)]">
                      {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[var(--border)]" />

                    <div className="space-y-6">
                      {filteredEvents.map((event: Event) => {
                        const riskLevel = getRiskLevel(event.risk_score);

                        return (
                          <div
                            key={event.event_id || event.id}
                            className="relative pl-16"
                          >
                            <div
                              className={`absolute left-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                                event.passed
                                  ? 'bg-[var(--success)]/10 border-2 border-[var(--success)]'
                                  : 'bg-[var(--danger)]/10 border-2 border-[var(--danger)]'
                              }`}
                            >
                              {event.passed ? (
                                <CheckCircle className="w-6 h-6 text-[var(--success)]" />
                              ) : (
                                <XCircle className="w-6 h-6 text-[var(--danger)]" />
                              )}
                            </div>

                            <div className="bg-[var(--surface-2)] rounded-xl p-6 hover:bg-[var(--surface-2)]/80 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h3 className="font-semibold">
                                    {event.passed ? 'Compliance Check Passed' : 'Compliance Check Failed'}
                                  </h3>
                                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                    event.passed
                                      ? 'bg-[var(--success)]/10 text-[var(--success)]'
                                      : 'bg-[var(--danger)]/10 text-[var(--danger)]'
                                  }`}>
                                    {event.passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                  <Clock className="w-4 h-4" />
                                  {new Date(event.created_at).toLocaleString()}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <div className="text-xs text-[var(--muted)] mb-1">Risk Score</div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-2xl font-bold">{event.risk_score.toFixed(1)}</div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      riskLevel.color === 'success'
                                        ? 'bg-[var(--success)]/10 text-[var(--success)]'
                                        : riskLevel.color === 'warning'
                                        ? 'bg-[var(--warning)]/10 text-[var(--warning)]'
                                        : 'bg-[var(--danger)]/10 text-[var(--danger)]'
                                    }`}>
                                      {riskLevel.label}
                                    </span>
                                  </div>
                                  <div className="mt-2 w-full bg-[var(--border)] rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${
                                        riskLevel.color === 'success'
                                          ? 'bg-[var(--success)]'
                                          : riskLevel.color === 'warning'
                                          ? 'bg-[var(--warning)]'
                                          : 'bg-[var(--danger)]'
                                      }`}
                                      style={{ width: `${Math.min(event.risk_score, 100)}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-[var(--muted)] mb-1">Event Type</div>
                                  <div className="text-sm font-medium">
                                    {event.event_type || 'Compliance Check'}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-xs text-[var(--muted)] mb-1">Checks Performed</div>
                                  <div className="text-sm font-medium">
                                    {event.reason_codes?.length || 0} validation{event.reason_codes?.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              </div>

                              {event.reason_codes && event.reason_codes.length > 0 && (
                                <div className="mb-4">
                                  <div className="text-xs text-[var(--muted)] mb-2">Validation Checks</div>
                                  <div className="flex flex-wrap gap-2">
                                    {event.reason_codes.map((code: string, codeIndex: number) => (
                                      <span
                                        key={codeIndex}
                                        className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--surface)] text-[var(--text)] border border-[var(--border)]"
                                      >
                                        {code}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <details className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                                <summary className="text-sm font-medium cursor-pointer select-none hover:text-[var(--primary)]">
                                  View Full Event Details
                                </summary>
                                <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto max-h-96">
                                  {JSON.stringify(event.details || event, null, 2)}
                                </pre>
                              </details>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {events.length > 0 && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <appConfig.complianceInfo.icon className={`w-5 h-5 text-[var(--${appConfig.complianceInfo.iconColor})] mt-0.5`} />
              <div>
                <h3 className="font-semibold mb-1">{appConfig.complianceInfo.title}</h3>
                <p className="text-sm text-[var(--muted)]">
                  {appConfig.complianceInfo.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
