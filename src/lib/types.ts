// API Error Response (DX Contract)
export interface APIError {
  detail: string;
  error_code: string;
}

// Project
export interface Project {
  project_id: string;
  name: string;
  description?: string;
  tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
  updated_at: string;
}

// Agent
export interface Agent {
  agent_id: string;
  id?: string; // Backward compatibility
  project_id: string;
  role: string;
  did: string;
  status: 'active' | 'inactive' | 'suspended';
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Run
export interface Run {
  run_id: string;
  id?: string; // Backward compatibility
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  created_at?: string; // Backward compatibility
  completed_at?: string;
  metadata?: Record<string, unknown>;
  // Backward compatibility for page components
  x402_count?: number;
  memory_count?: number;
  compliance_count?: number;
}

// X402 Request
export interface X402Request {
  request_id: string;
  id?: string; // Backward compatibility
  run_id: string;
  project_id: string;
  merchant_did: string;
  did?: string; // Backward compatibility alias for merchant_did
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  verified?: boolean; // Backward compatibility
  payload_hash?: string; // Backward compatibility
  created_at: string;
}

// Compliance Event
export interface ComplianceEvent {
  event_id: string;
  id?: string; // Backward compatibility
  run_id: string;
  project_id: string;
  event_type: string;
  risk_score: number;
  passed: boolean;
  details?: Record<string, unknown>;
  reason_codes?: string[]; // Backward compatibility
  created_at: string;
}

// Agent Memory
export interface AgentMemory {
  memory_id: string;
  id?: string; // Backward compatibility
  project_id: string;
  agent_id: string;
  agent_role?: string; // Backward compatibility
  run_id?: string;
  content: string;
  summary?: string; // Backward compatibility
  namespace: string;
  metadata?: Record<string, unknown>;
  details?: Record<string, unknown>; // Backward compatibility
  confidence_score?: number; // Backward compatibility
  created_at: string;
}

// Embedding Response
export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
  text: string;
  processing_time_ms: number;
}

// Search Result
export interface SearchResult {
  id: string;
  score: number;
  document: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

// Search Response
export interface SearchResponse {
  results: SearchResult[];
  model: string;
  namespace: string;
  processing_time_ms: number;
}

// Table (NoSQL)
export interface Table {
  table_id: string;
  project_id: string;
  name: string;
  description?: string;
  schema: TableSchema;
  row_count: number;
  created_at: string;
}

export interface TableSchema {
  fields: Record<string, FieldDefinition>;
  indexes?: IndexDefinition[];
}

export interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: unknown;
}

export interface IndexDefinition {
  fields: string[];
  unique?: boolean;
}

// Row
export interface Row {
  row_id: string;
  table_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Run Stats (for Overview page)
export interface RunStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  // Backward compatibility
  total_runs?: number;
  latest_run?: Run | null;
  total_x402_requests?: number;
  total_memory_entries?: number;
  total_compliance_events?: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
