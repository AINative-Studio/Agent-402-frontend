// API Error Response (DX Contract)
export interface APIError {
  detail: string;
  error_code: string;
  validation_errors?: ValidationError[];
}

// Validation Error Item
export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

// Project (aligned with backend ProjectResponse schema)
export interface Project {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  tier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  // Legacy fields for backward compatibility
  project_id?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Agent
export interface Agent {
  agent_id: string;
  id?: string; // Backward compatibility
  project_id: string;
  role: string;
  did: string;
  name?: string;
  description?: string;
  scope?: AgentScope;
  status: 'active' | 'inactive' | 'suspended';
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export type AgentScope = 'SYSTEM' | 'PROJECT' | 'RUN';

// Create Agent Request
export interface CreateAgentRequest {
  project_id: string;
  did: string;
  role: string;
  name: string;
  description?: string;
  scope?: AgentScope;
}

// Update Agent Request
export interface UpdateAgentRequest {
  role?: string;
  name?: string;
  description?: string;
  scope?: AgentScope;
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

// X402 Request Status (matches backend enum)
export type X402RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'COMPLETED';

// X402 Request
export interface X402Request {
  request_id: string;
  id?: string; // Backward compatibility
  project_id: string;
  agent_id: string;
  task_id: string;
  run_id: string;
  request_payload: Record<string, unknown>;
  signature: string;
  status: X402RequestStatus;
  timestamp: string;
  created_at?: string; // Backward compatibility
  linked_memory_ids: string[];
  linked_compliance_ids: string[];
  metadata?: Record<string, unknown>;
  // Backward compatibility fields
  merchant_did?: string;
  did?: string;
  amount?: number;
  currency?: string;
  verified?: boolean;
  payload_hash?: string;
}

// X402 Request with full linked records
export interface X402RequestWithLinks extends X402Request {
  linked_memories?: Array<Record<string, unknown>>;
  linked_compliance_events?: Array<Record<string, unknown>>;
}

// X402 Request List Response (matches backend pagination)
export interface X402RequestListResponse {
  requests: X402Request[];
  total: number;
  limit: number;
  offset: number;
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

// Table (NoSQL) - aligned with backend TableResponse schema
export type FieldType = 'string' | 'integer' | 'float' | 'boolean' | 'json' | 'timestamp';

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  default?: unknown;
}

export interface TableSchema {
  fields: Record<string, FieldDefinition>;
  indexes?: string[];
}

// Legacy IndexDefinition for backward compatibility
export interface IndexDefinition {
  fields: string[];
  unique?: boolean;
}

export interface Table {
  id: string;
  table_name: string;
  description?: string;
  schema: TableSchema;
  project_id: string;
  row_count: number;
  created_at: string;
  updated_at?: string;
  // Legacy fields for backward compatibility
  table_id?: string;
  name?: string;
}

export interface TableResponse {
  id: string;
  table_name: string;
  description?: string;
  schema: TableSchema;
  project_id: string;
  row_count: number;
  created_at: string;
  updated_at?: string;
}

export interface TableListResponse {
  tables: TableResponse[];
  total: number;
}

// Row - aligned with backend RowResponse schema
export interface Row {
  row_id: string;
  table_id: string;
  project_id: string;
  row_data: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  // Legacy field for backward compatibility
  data?: Record<string, unknown>;
}

export interface RowResponse {
  row_id: string;
  table_id: string;
  project_id: string;
  row_data: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface InsertedRow {
  row_id: string;
  created_at: string;
  row_data: Record<string, unknown>;
}

export interface RowInsertRequest {
  row_data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export interface RowInsertResponse {
  rows: InsertedRow[];
  inserted_count: number;
}

export interface RowListResponse {
  rows: Array<{
    row_id: string;
    table_id: string;
    row_data: Record<string, unknown>;
    created_at: string;
    updated_at?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface RowDeleteResponse {
  row_id: string;
  table_id: string;
  deleted: boolean;
  deleted_at: string;
}

// Table Creation
export interface CreateTableRequest {
  table_name: string;
  description?: string;
  schema: TableSchema;
}

export interface CreateTableResponse {
  id: string;
  table_name: string;
  description?: string;
  schema: TableSchema;
  project_id: string;
  row_count: number;
  created_at: string;
  updated_at?: string;
}

export interface TableDeleteResponse {
  id: string;
  table_name: string;
  deleted: boolean;
  deleted_at: string;
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

// Workflow Step Types
export type WorkflowStep = 'analysis' | 'compliance' | 'transaction';

export type StepStatus = 'pending' | 'active' | 'complete' | 'error';

export interface WorkflowStepInfo {
  step: WorkflowStep;
  label: string;
  description: string;
  agentRole: string;
  order: number;
}

export interface StepMemoryMetadata {
  workflow_step?: WorkflowStep;
  agent_role?: string;
  step_order?: number;
  memory_type?: string;
  confidence_score?: number;
}

export interface AgentDecision {
  agent_id: string;
  agent_did: string;
  agent_role: string;
  workflow_step: WorkflowStep;
  decision: string;
  rationale: string;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  confidence_score?: number;
  created_at: string;
}

// Row CRUD Types
export type FieldValue = string | number | boolean | Record<string, unknown> | unknown[];

export interface RowData {
  [key: string]: FieldValue;
}

export interface InsertRowsRequest {
  rows: RowData[];
}

export interface UpdateRowsRequest {
  filter: Record<string, unknown>;
  update: {
    $set?: Record<string, FieldValue>;
    $inc?: Record<string, number>;
    $push?: Record<string, unknown>;
    $pull?: Record<string, unknown>;
  };
  upsert?: boolean;
}

export interface DeleteRowsRequest {
  filter: Record<string, unknown>;
  limit?: number;
}

export interface InsertRowsResponse {
  success: boolean;
  inserted_count: number;
  inserted_ids?: string[];
  rows?: Array<{ id: string; created_at: string }>;
}

export interface UpdateRowsResponse {
  success: boolean;
  affected_rows: number;
  modified_rows?: number;
}

export interface DeleteRowsResponse {
  success: boolean;
  affected_rows: number;
  deleted_count?: number;
}

// Document Upload Types (Epic 7)
export interface DocumentUploadRequest {
  texts: string[];
  model?: string;
  namespace?: string;
  metadata?: Record<string, unknown>;
  upsert?: boolean;
}

export interface VectorResult {
  vector_id: string;
  document: string;
}

export interface DocumentUploadResponse {
  vector_ids: string[];
  stored_count: number;
  model: string;
  dimensions: number;
  namespace: string;
  results: VectorResult[];
  processing_time_ms: number;
}

export interface StoredDocument {
  vector_id: string;
  document: string;
  namespace: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Tool Call Types (for Issue #32)
export interface ToolCallEvent {
  event_id: string;
  event_type: 'agent_tool_call';
  data: ToolCallData;
  timestamp: string;
  source?: string;
  correlation_id?: string;
  created_at: string;
}

export interface ToolCallData {
  agent_id: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  duration_ms?: number;
  success?: boolean;
  error?: string;
}

export interface ToolCallWithTiming extends ToolCallEvent {
  duration_ms: number;
  start_time?: string;
  end_time?: string;
}

// Workflow Visualization Types (Issue #29)
export type WorkflowAgentType = 'analyst' | 'compliance' | 'transaction';

export type WorkflowStepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface WorkflowAgentState {
  agentType: WorkflowAgentType;
  name: string;
  did: string;
  status: WorkflowStepStatus;
  startedAt?: string;
  completedAt?: string;
  progress: number;
  currentTask?: string;
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowDataFlow {
  from: WorkflowAgentType;
  to: WorkflowAgentType;
  label: string;
  active: boolean;
  data?: Record<string, unknown>;
}

export interface WorkflowState {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentAgent?: WorkflowAgentType;
  agents: {
    analyst: WorkflowAgentState;
    compliance: WorkflowAgentState;
    transaction: WorkflowAgentState;
  };
  dataFlows: WorkflowDataFlow[];
  startedAt?: string;
  completedAt?: string;
  elapsedTime?: number;
}

export interface WorkflowEvent {
  type: 'agent_started' | 'agent_progress' | 'agent_completed' | 'agent_error' | 'data_flow' | 'workflow_completed';
  timestamp: string;
  agentType?: WorkflowAgentType;
  data?: Record<string, unknown>;
  message?: string;
}

// Demo Dashboard Types (Issue #33)
export type DemoScenarioType = 'market_analysis' | 'compliance_check' | 'full_transaction';

export interface DemoConfiguration {
  scenarioType: DemoScenarioType;
  parameters: Record<string, unknown>;
  agentConfig?: {
    analyst?: Record<string, unknown>;
    compliance?: Record<string, unknown>;
    transaction?: Record<string, unknown>;
  };
  mockData?: Record<string, unknown>;
}

export interface DemoScenario {
  id: string;
  type: DemoScenarioType;
  title: string;
  description: string;
  estimatedDuration: string;
  complexity: 'simple' | 'moderate' | 'complex';
  defaultConfig: DemoConfiguration;
  previewData?: {
    expectedOutputs: string[];
    keyMetrics: Array<{ label: string; value: string }>;
  };
}

export interface DemoRun {
  demoRunId: string;
  scenarioId: string;
  scenarioType: DemoScenarioType;
  runId?: string;
  projectId: string;
  status: 'pending' | 'launching' | 'running' | 'completed' | 'failed';
  configuration: DemoConfiguration;
  startedAt: string;
  completedAt?: string;
  progress: number;
  currentStep?: string;
  results?: {
    memory_count?: number;
    compliance_count?: number;
    x402_count?: number;
    success: boolean;
    summary?: string;
  };
  error?: string;
}
