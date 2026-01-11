/*
  # Fintech Agent Crew Demo Schema

  ## Overview
  Creates database schema for autonomous fintech agent workflow demo.
  Supports X402 cryptographic request signing, agent memory persistence,
  and compliance event tracking.

  ## New Tables

  ### `agents`
  Stores agent identities and roles in the multi-agent system
  - `id` (uuid, primary key)
  - `role` (text) - Agent role (analyst, compliance, transaction)
  - `did` (text) - Decentralized identifier for X402 signing
  - `created_at` (timestamptz)

  ### `x402_requests`
  Cryptographically signed requests with verification status
  - `id` (uuid, primary key)
  - `run_id` (text) - Groups requests by execution run
  - `agent_id` (uuid) - Foreign key to agents
  - `did` (text) - DID of signing agent
  - `payload` (jsonb) - Request payload
  - `payload_hash` (text) - SHA-256 hash of payload
  - `signature` (text) - Cryptographic signature
  - `verified` (boolean) - Server verification result
  - `created_at` (timestamptz)

  ### `agent_memory`
  Persistent memory entries for agents across runs
  - `id` (uuid, primary key)
  - `run_id` (text)
  - `agent_id` (uuid) - Foreign key to agents
  - `agent_role` (text) - Agent role for filtering
  - `summary` (text) - Memory summary
  - `details` (jsonb) - Full memory data
  - `confidence_score` (numeric) - Optional confidence metric
  - `created_at` (timestamptz)

  ### `compliance_events`
  Compliance and risk assessment events
  - `id` (uuid, primary key)
  - `run_id` (text)
  - `agent_id` (uuid) - Foreign key to agents
  - `risk_score` (numeric) - Risk assessment score
  - `passed` (boolean) - Pass/fail status
  - `reason_codes` (text[]) - Array of reason codes
  - `details` (jsonb) - Full compliance data
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for demo purposes (read-only UI)
  - No write policies (data inserted via backend only)
*/

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  did text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to agents"
  ON agents
  FOR SELECT
  TO public
  USING (true);

-- Create x402_requests table
CREATE TABLE IF NOT EXISTS x402_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL,
  agent_id uuid REFERENCES agents(id),
  did text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  payload_hash text NOT NULL,
  signature text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE x402_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to x402_requests"
  ON x402_requests
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_x402_requests_run_id ON x402_requests(run_id);
CREATE INDEX IF NOT EXISTS idx_x402_requests_agent_id ON x402_requests(agent_id);

-- Create agent_memory table
CREATE TABLE IF NOT EXISTS agent_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL,
  agent_id uuid REFERENCES agents(id),
  agent_role text NOT NULL,
  summary text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  confidence_score numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to agent_memory"
  ON agent_memory
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_agent_memory_run_id ON agent_memory(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_role ON agent_memory(agent_role);

-- Create compliance_events table
CREATE TABLE IF NOT EXISTS compliance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id text NOT NULL,
  agent_id uuid REFERENCES agents(id),
  risk_score numeric NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  reason_codes text[] DEFAULT '{}',
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to compliance_events"
  ON compliance_events
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_compliance_events_run_id ON compliance_events(run_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_passed ON compliance_events(passed);