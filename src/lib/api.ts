import { apiClient } from './apiClient';
import type { Agent, X402Request, AgentMemory, ComplianceEvent, Run, RunStats } from './types';

// Get current project ID from context or localStorage
function getProjectId(): string {
  return localStorage.getItem('projectId') || 'default';
}

export async function getAgents(): Promise<Agent[]> {
  const projectId = getProjectId();
  const response = await apiClient.get(`/${projectId}/agents`);
  return response.data.items || response.data || [];
}

export async function getRuns(): Promise<Run[]> {
  const projectId = getProjectId();
  const response = await apiClient.get(`/${projectId}/runs`);
  return response.data.items || response.data || [];
}

export async function getRunStats(): Promise<RunStats> {
  const runs = await getRuns();

  // Calculate stats from runs
  const total = runs.length;
  const pending = runs.filter(r => r.status === 'pending').length;
  const running = runs.filter(r => r.status === 'running').length;
  const completed = runs.filter(r => r.status === 'completed').length;
  const failed = runs.filter(r => r.status === 'failed').length;

  // Get latest run
  const sortedRuns = [...runs].sort((a, b) =>
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );

  return {
    total,
    pending,
    running,
    completed,
    failed,
    total_runs: total,
    latest_run: sortedRuns[0] || null,
    total_x402_requests: 0, // Will be fetched separately if needed
    total_memory_entries: 0,
    total_compliance_events: 0,
  };
}

export async function getX402RequestsByRun(runId: string): Promise<X402Request[]> {
  const projectId = getProjectId();
  const response = await apiClient.get(`/${projectId}/x402-requests`, {
    params: { run_id: runId }
  });
  return response.data.items || response.data || [];
}

export async function getAgentMemoryByRun(runId: string): Promise<AgentMemory[]> {
  const projectId = getProjectId();
  const response = await apiClient.get(`/${projectId}/agent-memory`, {
    params: { run_id: runId }
  });
  return response.data.items || response.data || [];
}

export async function getComplianceEventsByRun(runId: string): Promise<ComplianceEvent[]> {
  const projectId = getProjectId();
  const response = await apiClient.get(`/${projectId}/compliance-events`, {
    params: { run_id: runId }
  });
  return response.data.items || response.data || [];
}
