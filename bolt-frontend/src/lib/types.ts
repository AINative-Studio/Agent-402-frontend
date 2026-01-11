export interface Agent {
  id: string;
  role: string;
  did: string;
  created_at: string;
}

export interface X402Request {
  id: string;
  run_id: string;
  agent_id: string;
  did: string;
  payload: Record<string, any>;
  payload_hash: string;
  signature: string;
  verified: boolean;
  created_at: string;
}

export interface AgentMemory {
  id: string;
  run_id: string;
  agent_id: string;
  agent_role: string;
  summary: string;
  details: Record<string, any>;
  confidence_score?: number;
  created_at: string;
}

export interface ComplianceEvent {
  id: string;
  run_id: string;
  agent_id: string;
  risk_score: number;
  passed: boolean;
  reason_codes: string[];
  details: Record<string, any>;
  created_at: string;
}

export interface Run {
  run_id: string;
  status: 'completed' | 'failed' | 'running';
  created_at: string;
  x402_count: number;
  memory_count: number;
  compliance_count: number;
}

export interface RunStats {
  total_runs: number;
  latest_run?: Run;
  total_x402_requests: number;
  total_memory_entries: number;
  total_compliance_events: number;
}
