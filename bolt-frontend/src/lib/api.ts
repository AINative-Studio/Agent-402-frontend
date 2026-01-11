import { supabase } from './supabase';
import type { Agent, X402Request, AgentMemory, ComplianceEvent, Run, RunStats } from './types';

export async function getAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getRuns(): Promise<Run[]> {
  const { data: x402Data } = await supabase
    .from('x402_requests')
    .select('run_id, created_at');

  if (!x402Data || x402Data.length === 0) return [];

  const runMap = new Map<string, { created_at: string; x402_count: number; memory_count: number; compliance_count: number }>();

  for (const item of x402Data) {
    if (!runMap.has(item.run_id)) {
      runMap.set(item.run_id, {
        created_at: item.created_at,
        x402_count: 0,
        memory_count: 0,
        compliance_count: 0,
      });
    }
    runMap.get(item.run_id)!.x402_count++;
  }

  const { data: memoryData } = await supabase
    .from('agent_memory')
    .select('run_id');

  if (memoryData) {
    for (const item of memoryData) {
      if (runMap.has(item.run_id)) {
        runMap.get(item.run_id)!.memory_count++;
      }
    }
  }

  const { data: complianceData } = await supabase
    .from('compliance_events')
    .select('run_id');

  if (complianceData) {
    for (const item of complianceData) {
      if (runMap.has(item.run_id)) {
        runMap.get(item.run_id)!.compliance_count++;
      }
    }
  }

  const runs: Run[] = Array.from(runMap.entries()).map(([run_id, data]) => ({
    run_id,
    status: 'completed' as const,
    created_at: data.created_at,
    x402_count: data.x402_count,
    memory_count: data.memory_count,
    compliance_count: data.compliance_count,
  }));

  return runs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getRunStats(): Promise<RunStats> {
  const runs = await getRuns();

  const { count: x402Count } = await supabase
    .from('x402_requests')
    .select('*', { count: 'exact', head: true });

  const { count: memoryCount } = await supabase
    .from('agent_memory')
    .select('*', { count: 'exact', head: true });

  const { count: complianceCount } = await supabase
    .from('compliance_events')
    .select('*', { count: 'exact', head: true });

  return {
    total_runs: runs.length,
    latest_run: runs[0],
    total_x402_requests: x402Count || 0,
    total_memory_entries: memoryCount || 0,
    total_compliance_events: complianceCount || 0,
  };
}

export async function getX402RequestsByRun(runId: string): Promise<X402Request[]> {
  const { data, error } = await supabase
    .from('x402_requests')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAgentMemoryByRun(runId: string): Promise<AgentMemory[]> {
  const { data, error } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getComplianceEventsByRun(runId: string): Promise<ComplianceEvent[]> {
  const { data, error } = await supabase
    .from('compliance_events')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}
