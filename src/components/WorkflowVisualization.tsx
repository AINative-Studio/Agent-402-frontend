import { useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, ArrowRight, Loader2, TrendingUp, Shield, DollarSign } from 'lucide-react';
import { useWorkflowStream } from '../hooks/useWorkflowStream';
import type { AgentMemory, ComplianceEvent, X402Request, WorkflowAgentState, WorkflowStepStatus } from '../lib/types';

interface WorkflowVisualizationProps {
    runId: string;
    projectId: string;
    memory: AgentMemory[];
    compliance: ComplianceEvent[];
    x402Requests: X402Request[];
    autoStart?: boolean;
}

/**
 * Real-time workflow visualization component.
 * Displays agent progression through the CrewAI workflow:
 * Analysis -> Compliance -> Transaction
 */
export function WorkflowVisualization({
    runId,
    projectId,
    memory,
    compliance,
    x402Requests,
    autoStart = true
}: WorkflowVisualizationProps) {
    const { workflowState, error, startStreaming, stopStreaming } = useWorkflowStream({
        runId,
        projectId,
        memory,
        compliance,
        x402Requests,
        pollingInterval: 2000
    });

    useEffect(() => {
        if (autoStart) {
            startStreaming();
        }
        return () => {
            stopStreaming();
        };
    }, [autoStart, startStreaming, stopStreaming]);

    if (error) {
        return (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 text-red-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Workflow visualization error: {error}</span>
                </div>
            </div>
        );
    }

    if (!workflowState) {
        return (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center gap-3 text-[var(--muted)]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading workflow state...</span>
                </div>
            </div>
        );
    }

    const getStatusIcon = (status: WorkflowStepStatus) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-6 h-6 text-[var(--success)]" />;
            case 'active':
                return <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />;
            case 'error':
                return <AlertCircle className="w-6 h-6 text-red-500" />;
            default:
                return <Clock className="w-6 h-6 text-[var(--muted)]" />;
        }
    };

    const getAgentIcon = (agentType: string) => {
        switch (agentType) {
            case 'analyst':
                return TrendingUp;
            case 'compliance':
                return Shield;
            case 'transaction':
                return DollarSign;
            default:
                return Clock;
        }
    };

    const getStatusColor = (status: WorkflowStepStatus) => {
        switch (status) {
            case 'completed':
                return 'var(--success)';
            case 'active':
                return 'var(--primary)';
            case 'error':
                return 'rgb(239, 68, 68)';
            default:
                return 'var(--muted)';
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '0s';
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const AgentCard = ({ agent }: { agent: WorkflowAgentState }) => {
        const Icon = getAgentIcon(agent.agentType);
        const isActive = agent.status === 'active';

        return (
            <div
                className={`relative bg-[var(--surface-2)] border rounded-xl p-6 transition-all duration-300 ${
                    isActive
                        ? 'border-[var(--primary)] shadow-lg scale-105'
                        : agent.status === 'completed'
                        ? 'border-[var(--success)]'
                        : 'border-[var(--border)]'
                }`}
            >
                {isActive && (
                    <div className="absolute -top-1 -right-1">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
                        </span>
                    </div>
                )}

                <div className="flex items-start gap-4">
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            agent.status === 'completed'
                                ? 'bg-[var(--success)]/10'
                                : isActive
                                ? 'bg-[var(--primary)]/10'
                                : 'bg-[var(--surface)]'
                        }`}
                    >
                        <Icon
                            className="w-6 h-6"
                            style={{ color: getStatusColor(agent.status) }}
                        />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{agent.name}</h3>
                            {getStatusIcon(agent.status)}
                        </div>
                        <p className="text-xs text-[var(--muted)] font-mono mb-3 truncate">
                            {agent.did}
                        </p>

                        {agent.status !== 'pending' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[var(--muted)]">Progress</span>
                                    <span className="font-medium">{agent.progress}%</span>
                                </div>
                                <div className="w-full bg-[var(--surface)] rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${agent.progress}%`,
                                            backgroundColor: getStatusColor(agent.status)
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {agent.currentTask && (
                            <p className="text-xs text-[var(--muted)] mt-3 italic">
                                {agent.currentTask}
                            </p>
                        )}

                        {agent.output && agent.status === 'completed' && (
                            <details className="mt-3">
                                <summary className="text-xs text-[var(--primary)] cursor-pointer select-none hover:underline">
                                    View Output
                                </summary>
                                <pre className="mt-2 text-xs font-mono text-[var(--muted)] overflow-auto max-h-32 bg-[var(--surface)] rounded p-2">
                                    {JSON.stringify(agent.output, null, 2)}
                                </pre>
                            </details>
                        )}

                        {agent.error && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                                {agent.error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Workflow Header */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Workflow Execution</h2>
                        <p className="text-sm text-[var(--muted)]">
                            Real-time agent progression through CrewAI workflow
                        </p>
                    </div>
                    <div className="text-right">
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                                workflowState.status === 'completed'
                                    ? 'bg-[var(--success)]/10 text-[var(--success)]'
                                    : workflowState.status === 'running'
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                                    : workflowState.status === 'failed'
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-[var(--surface-2)] text-[var(--muted)]'
                            }`}
                        >
                            {workflowState.status === 'running' && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {workflowState.status.toUpperCase()}
                        </div>
                        {workflowState.elapsedTime !== undefined && (
                            <p className="text-xs text-[var(--muted)] mt-2">
                                Duration: {formatDuration(workflowState.elapsedTime)}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Agent Flow Visualization */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    {/* Analyst Agent */}
                    <AgentCard agent={workflowState.agents.analyst} />

                    {/* Flow Arrow 1 */}
                    <div className="hidden md:flex justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <ArrowRight
                                className={`w-8 h-8 transition-colors duration-300 ${
                                    workflowState.dataFlows[0].active
                                        ? 'text-[var(--primary)]'
                                        : 'text-[var(--muted)]'
                                }`}
                            />
                            <span className="text-xs text-[var(--muted)] text-center">
                                {workflowState.dataFlows[0].label}
                            </span>
                        </div>
                    </div>

                    {/* Compliance Agent */}
                    <AgentCard agent={workflowState.agents.compliance} />

                    {/* Flow Arrow 2 */}
                    <div className="hidden md:flex justify-center md:col-start-2">
                        <div className="flex flex-col items-center gap-2">
                            <ArrowRight
                                className={`w-8 h-8 transition-colors duration-300 ${
                                    workflowState.dataFlows[1].active
                                        ? 'text-[var(--primary)]'
                                        : 'text-[var(--muted)]'
                                }`}
                            />
                            <span className="text-xs text-[var(--muted)] text-center">
                                {workflowState.dataFlows[1].label}
                            </span>
                        </div>
                    </div>

                    {/* Transaction Agent */}
                    <AgentCard agent={workflowState.agents.transaction} />
                </div>
            </div>

            {/* Timeline View */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Execution Timeline</h3>
                <div className="space-y-4">
                    {Object.values(workflowState.agents).map((agent, index) => (
                        <div key={agent.agentType} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        agent.status === 'completed'
                                            ? 'bg-[var(--success)]/10'
                                            : agent.status === 'active'
                                            ? 'bg-[var(--primary)]/10'
                                            : 'bg-[var(--surface-2)]'
                                    }`}
                                >
                                    {getStatusIcon(agent.status)}
                                </div>
                                {index < 2 && (
                                    <div
                                        className={`w-0.5 h-12 ${
                                            agent.status === 'completed'
                                                ? 'bg-[var(--success)]'
                                                : 'bg-[var(--border)]'
                                        }`}
                                    />
                                )}
                            </div>

                            <div className="flex-1 pb-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-sm">{agent.name}</h4>
                                        <p className="text-xs text-[var(--muted)] font-mono mt-1">
                                            {agent.agentType}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-[var(--muted)]">
                                        {agent.startedAt && (
                                            <div>
                                                Started: {new Date(agent.startedAt).toLocaleTimeString()}
                                            </div>
                                        )}
                                        {agent.completedAt && (
                                            <div>
                                                Completed: {new Date(agent.completedAt).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
