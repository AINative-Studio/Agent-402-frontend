import { useState, useEffect, useRef, useCallback } from 'react';
import type {
    WorkflowState,
    AgentMemory,
    ComplianceEvent,
    X402Request
} from '../lib/types';

interface UseWorkflowStreamOptions {
    runId?: string;
    projectId?: string;
    pollingInterval?: number;
    memory?: AgentMemory[];
    compliance?: ComplianceEvent[];
    x402Requests?: X402Request[];
}

interface UseWorkflowStreamReturn {
    workflowState: WorkflowState | null;
    isStreaming: boolean;
    error: string | null;
    startStreaming: () => void;
    stopStreaming: () => void;
}

/**
 * Custom hook for real-time workflow visualization.
 *
 * Since the backend doesn't expose WebSocket/SSE endpoints yet,
 * this hook simulates real-time updates by polling the existing
 * data and reconstructing workflow state from memory, compliance,
 * and x402 request records.
 *
 * Future Enhancement: Replace polling with WebSocket/SSE when available.
 */
export function useWorkflowStream(
    options: UseWorkflowStreamOptions
): UseWorkflowStreamReturn {
    const {
        runId,
        projectId,
        pollingInterval = 1000,
        memory = [],
        compliance = [],
        x402Requests = []
    } = options;

    const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousDataRef = useRef<{
        memoryCount: number;
        complianceCount: number;
        x402Count: number;
    }>({
        memoryCount: 0,
        complianceCount: 0,
        x402Count: 0
    });

    /**
     * Create initial workflow state with all agents pending
     */
    const createInitialState = useCallback((): WorkflowState => {
        return {
            runId: runId || '',
            status: 'pending',
            agents: {
                analyst: {
                    agentType: 'analyst',
                    name: 'Financial Analyst',
                    did: 'did:ethr:0xanalyst001',
                    status: 'pending',
                    progress: 0
                },
                compliance: {
                    agentType: 'compliance',
                    name: 'Compliance Officer',
                    did: 'did:ethr:0xcompliance001',
                    status: 'pending',
                    progress: 0
                },
                transaction: {
                    agentType: 'transaction',
                    name: 'Transaction Executor',
                    did: 'did:ethr:0xtransaction001',
                    status: 'pending',
                    progress: 0
                }
            },
            dataFlows: [
                {
                    from: 'analyst',
                    to: 'compliance',
                    label: 'Analysis Results',
                    active: false
                },
                {
                    from: 'compliance',
                    to: 'transaction',
                    label: 'Compliance Approval',
                    active: false
                }
            ]
        };
    }, [runId]);

    /**
     * Reconstruct workflow state from available data
     */
    const reconstructWorkflowState = useCallback((): WorkflowState => {
        const state = createInitialState();

        if (!memory.length && !compliance.length && !x402Requests.length) {
            return state;
        }

        // Find analyst memory entries
        const analystMemories = memory.filter(m =>
            m.agent_role?.toLowerCase().includes('analyst') ||
            m.metadata?.agent_role?.toString().toLowerCase().includes('analyst')
        );

        // Find compliance memories
        const complianceMemories = memory.filter(m =>
            m.agent_role?.toLowerCase().includes('compliance') ||
            m.metadata?.agent_role?.toString().toLowerCase().includes('compliance')
        );

        // Find transaction memories
        const transactionMemories = memory.filter(m =>
            m.agent_role?.toLowerCase().includes('transaction') ||
            m.metadata?.agent_role?.toString().toLowerCase().includes('transaction')
        );

        // Update analyst state
        if (analystMemories.length > 0) {
            const latestAnalyst = analystMemories[analystMemories.length - 1];
            state.agents.analyst.status = 'completed';
            state.agents.analyst.progress = 100;
            state.agents.analyst.startedAt = analystMemories[0].created_at;
            state.agents.analyst.completedAt = latestAnalyst.created_at;
            state.agents.analyst.output = {
                content: latestAnalyst.content,
                summary: latestAnalyst.summary
            };
            state.dataFlows[0].active = true;
        }

        // Update compliance state
        if (compliance.length > 0) {
            const latestCompliance = compliance[compliance.length - 1];
            state.agents.compliance.status = 'completed';
            state.agents.compliance.progress = 100;
            state.agents.compliance.startedAt = compliance[0].created_at;
            state.agents.compliance.completedAt = latestCompliance.created_at;
            state.agents.compliance.output = {
                riskScore: latestCompliance.risk_score,
                passed: latestCompliance.passed,
                details: latestCompliance.details
            };
            state.dataFlows[1].active = true;
        } else if (complianceMemories.length > 0) {
            const latestCompliance = complianceMemories[complianceMemories.length - 1];
            state.agents.compliance.status = 'completed';
            state.agents.compliance.progress = 100;
            state.agents.compliance.startedAt = complianceMemories[0].created_at;
            state.agents.compliance.completedAt = latestCompliance.created_at;
            state.agents.compliance.output = {
                content: latestCompliance.content
            };
            state.dataFlows[1].active = true;
        }

        // Update transaction state
        if (x402Requests.length > 0) {
            const latestX402 = x402Requests[x402Requests.length - 1];
            state.agents.transaction.status = 'completed';
            state.agents.transaction.progress = 100;
            state.agents.transaction.startedAt = x402Requests[0].created_at || x402Requests[0].timestamp;
            state.agents.transaction.completedAt = latestX402.created_at || latestX402.timestamp;
            state.agents.transaction.output = {
                requestId: latestX402.request_id,
                status: latestX402.status,
                signature: latestX402.signature
            };
        } else if (transactionMemories.length > 0) {
            const latestTransaction = transactionMemories[transactionMemories.length - 1];
            state.agents.transaction.status = 'completed';
            state.agents.transaction.progress = 100;
            state.agents.transaction.startedAt = transactionMemories[0].created_at;
            state.agents.transaction.completedAt = latestTransaction.created_at;
            state.agents.transaction.output = {
                content: latestTransaction.content
            };
        }

        // Determine current agent and overall status
        if (state.agents.transaction.status === 'completed') {
            state.status = 'completed';
            state.currentAgent = 'transaction';
        } else if (state.agents.compliance.status === 'completed') {
            state.status = 'running';
            state.currentAgent = 'transaction';
            state.agents.transaction.status = 'active';
        } else if (state.agents.analyst.status === 'completed') {
            state.status = 'running';
            state.currentAgent = 'compliance';
            state.agents.compliance.status = 'active';
        } else if (analystMemories.length > 0) {
            state.status = 'running';
            state.currentAgent = 'analyst';
            state.agents.analyst.status = 'active';
        }

        // Calculate elapsed time
        if (state.agents.analyst.startedAt) {
            state.startedAt = state.agents.analyst.startedAt;
            const endTime = state.status === 'completed' && state.agents.transaction.completedAt
                ? new Date(state.agents.transaction.completedAt)
                : new Date();
            const startTime = new Date(state.startedAt);
            state.elapsedTime = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        }

        if (state.status === 'completed' && state.agents.transaction.completedAt) {
            state.completedAt = state.agents.transaction.completedAt;
        }

        return state;
    }, [memory, compliance, x402Requests, createInitialState]);

    /**
     * Update workflow state based on new data
     */
    const updateWorkflowState = useCallback(() => {
        try {
            const newState = reconstructWorkflowState();
            setWorkflowState(newState);

            // Detect changes for potential event generation
            const currentData = {
                memoryCount: memory.length,
                complianceCount: compliance.length,
                x402Count: x402Requests.length
            };

            // Check if data changed
            if (
                currentData.memoryCount !== previousDataRef.current.memoryCount ||
                currentData.complianceCount !== previousDataRef.current.complianceCount ||
                currentData.x402Count !== previousDataRef.current.x402Count
            ) {
                previousDataRef.current = currentData;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update workflow state');
        }
    }, [reconstructWorkflowState, memory, compliance, x402Requests]);

    /**
     * Start streaming workflow updates
     */
    const startStreaming = useCallback(() => {
        if (!runId || !projectId) {
            setError('Missing runId or projectId');
            return;
        }

        setIsStreaming(true);
        setError(null);

        // Initial state update
        updateWorkflowState();

        // Set up polling interval
        intervalRef.current = setInterval(() => {
            updateWorkflowState();
        }, pollingInterval);
    }, [runId, projectId, pollingInterval, updateWorkflowState]);

    /**
     * Stop streaming workflow updates
     */
    const stopStreaming = useCallback(() => {
        setIsStreaming(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    /**
     * Update workflow state whenever data changes
     */
    useEffect(() => {
        if (isStreaming) {
            updateWorkflowState();
        }
    }, [memory, compliance, x402Requests, isStreaming, updateWorkflowState]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        workflowState,
        isStreaming,
        error,
        startStreaming,
        stopStreaming
    };
}
