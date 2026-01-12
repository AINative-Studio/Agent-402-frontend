import { Clock, AlertCircle, Database, Shield, Activity, Wrench } from 'lucide-react';
import type { ReplayStep } from '../hooks/useRunReplay';
import type { AgentMemory, ComplianceEvent, X402Request, ToolCallEvent } from '../lib/types';

interface WorkflowStepViewerProps {
    step: ReplayStep;
    stepNumber: number;
    totalSteps: number;
}

/**
 * WorkflowStepViewer displays detailed information about a single workflow step
 * including agent info, inputs/outputs, decisions, and related events.
 */
export function WorkflowStepViewer({
    step,
    stepNumber,
    totalSteps
}: WorkflowStepViewerProps) {
    /**
     * Format timestamp for display with milliseconds
     */
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
    };

    /**
     * Get step type icon
     */
    const getStepIcon = () => {
        switch (step.type) {
            case 'memory':
                return <Database className="w-6 h-6 text-[var(--warning)]" />;
            case 'compliance':
                return <Shield className="w-6 h-6 text-[var(--success)]" />;
            case 'x402':
                return <Activity className="w-6 h-6 text-[var(--primary)]" />;
            case 'tool_call':
                return <Wrench className="w-6 h-6 text-purple-600" />;
            default:
                return <Clock className="w-6 h-6 text-[var(--muted)]" />;
        }
    };

    /**
     * Render memory-specific details
     */
    const renderMemoryDetails = (memory: AgentMemory) => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailCard
                    label="Agent"
                    value={memory.agent_role || memory.agent_id}
                    icon={<Database className="w-4 h-4" />}
                />
                <DetailCard
                    label="Namespace"
                    value={memory.namespace}
                />
            </div>

            <div className="bg-[var(--surface-2)] rounded-xl p-4">
                <h4 className="text-sm font-semibold mb-2">Memory Content</h4>
                <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">
                    {memory.content}
                </p>
            </div>

            {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                <details className="bg-[var(--surface-2)] rounded-xl p-4">
                    <summary className="text-sm font-medium cursor-pointer select-none hover:text-[var(--primary)]">
                        Memory Metadata
                    </summary>
                    <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto">
                        {JSON.stringify(memory.metadata, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );

    /**
     * Render compliance-specific details
     */
    const renderComplianceDetails = (compliance: ComplianceEvent) => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailCard
                    label="Event Type"
                    value={compliance.event_type}
                    icon={<Shield className="w-4 h-4" />}
                />
                <DetailCard
                    label="Risk Score"
                    value={compliance.risk_score.toFixed(3)}
                    highlight={compliance.risk_score > 0.7 ? 'error' : compliance.risk_score > 0.4 ? 'warning' : 'success'}
                />
                <DetailCard
                    label="Status"
                    value={compliance.passed ? 'PASSED' : 'FAILED'}
                    highlight={compliance.passed ? 'success' : 'error'}
                />
            </div>

            {compliance.details && Object.keys(compliance.details).length > 0 && (
                <div className="bg-[var(--surface-2)] rounded-xl p-4">
                    <h4 className="text-sm font-semibold mb-2">Compliance Details</h4>
                    <div className="space-y-2">
                        {Object.entries(compliance.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-start">
                                <span className="text-sm text-[var(--muted)] font-medium">{key}:</span>
                                <span className="text-sm text-[var(--text)] font-mono ml-2">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {compliance.reason_codes && compliance.reason_codes.length > 0 && (
                <div className="bg-[var(--surface-2)] rounded-xl p-4">
                    <h4 className="text-sm font-semibold mb-2">Reason Codes</h4>
                    <div className="flex flex-wrap gap-2">
                        {compliance.reason_codes.map((code, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--warning)]/10 text-[var(--warning)]"
                            >
                                {code}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    /**
     * Render X402-specific details
     */
    const renderX402Details = (x402: X402Request) => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailCard
                    label="Status"
                    value={x402.status}
                    highlight={
                        x402.status === 'COMPLETED' || x402.status === 'APPROVED'
                            ? 'success'
                            : x402.status === 'REJECTED' || x402.status === 'EXPIRED'
                            ? 'error'
                            : 'warning'
                    }
                    icon={<Activity className="w-4 h-4" />}
                />
                <DetailCard
                    label="Task ID"
                    value={x402.task_id}
                />
                <DetailCard
                    label="Agent"
                    value={x402.agent_id}
                />
            </div>

            {x402.request_payload && Object.keys(x402.request_payload).length > 0 && (
                <details className="bg-[var(--surface-2)] rounded-xl p-4">
                    <summary className="text-sm font-medium cursor-pointer select-none hover:text-[var(--primary)]">
                        Request Payload
                    </summary>
                    <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto max-h-64">
                        {JSON.stringify(x402.request_payload, null, 2)}
                    </pre>
                </details>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {x402.linked_memory_ids.length > 0 && (
                    <div className="bg-[var(--surface-2)] rounded-xl p-4">
                        <h4 className="text-sm font-semibold mb-2">Linked Memory IDs</h4>
                        <div className="space-y-1">
                            {x402.linked_memory_ids.map((memId, idx) => (
                                <div key={idx} className="text-xs font-mono text-[var(--muted)]">
                                    {memId}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {x402.linked_compliance_ids.length > 0 && (
                    <div className="bg-[var(--surface-2)] rounded-xl p-4">
                        <h4 className="text-sm font-semibold mb-2">Linked Compliance IDs</h4>
                        <div className="space-y-1">
                            {x402.linked_compliance_ids.map((compId, idx) => (
                                <div key={idx} className="text-xs font-mono text-[var(--muted)]">
                                    {compId}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {x402.signature && (
                <details className="bg-[var(--surface-2)] rounded-xl p-4">
                    <summary className="text-sm font-medium cursor-pointer select-none hover:text-[var(--primary)]">
                        Signature
                    </summary>
                    <div className="mt-3 text-xs font-mono text-[var(--muted)] break-all">
                        {x402.signature}
                    </div>
                </details>
            )}
        </div>
    );

    /**
     * Render tool call-specific details
     */
    const renderToolCallDetails = (toolCall: ToolCallEvent) => {
        const data = toolCall.data;
        const success = data.success !== false;

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailCard
                        label="Tool Name"
                        value={data.tool_name}
                        icon={<Wrench className="w-4 h-4" />}
                    />
                    <DetailCard
                        label="Duration"
                        value={data.duration_ms ? `${data.duration_ms}ms` : 'N/A'}
                    />
                    <DetailCard
                        label="Status"
                        value={success ? 'SUCCESS' : 'FAILED'}
                        highlight={success ? 'success' : 'error'}
                    />
                </div>

                {data.parameters && Object.keys(data.parameters).length > 0 && (
                    <details className="bg-[var(--surface-2)] rounded-xl p-4">
                        <summary className="text-sm font-medium cursor-pointer select-none hover:text-[var(--primary)]">
                            Tool Parameters
                        </summary>
                        <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto max-h-64">
                            {JSON.stringify(data.parameters, null, 2)}
                        </pre>
                    </details>
                )}

                {data.result && Object.keys(data.result).length > 0 && (
                    <details className="bg-[var(--surface-2)] rounded-xl p-4">
                        <summary className="text-sm font-medium cursor-pointer select-none hover:text-[var(--primary)]">
                            Tool Result
                        </summary>
                        <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto max-h-64">
                            {JSON.stringify(data.result, null, 2)}
                        </pre>
                    </details>
                )}

                {data.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Error
                        </h4>
                        <p className="text-sm text-red-600">{data.error}</p>
                    </div>
                )}
            </div>
        );
    };

    /**
     * Render step-specific details based on type
     */
    const renderStepDetails = () => {
        switch (step.type) {
            case 'memory':
                return renderMemoryDetails(step.data as AgentMemory);
            case 'compliance':
                return renderComplianceDetails(step.data as ComplianceEvent);
            case 'x402':
                return renderX402Details(step.data as X402Request);
            case 'tool_call':
                return renderToolCallDetails(step.data as ToolCallEvent);
            default:
                return (
                    <div className="text-sm text-[var(--muted)]">
                        No additional details available
                    </div>
                );
        }
    };

    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            {/* Step Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                    {getStepIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-semibold">{step.title}</h3>
                                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                                    Step {stepNumber} of {totalSteps}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--muted)]">{step.description}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                            <div className="text-xs text-[var(--muted)] mb-1">Timestamp</div>
                            <div className="text-sm font-mono text-[var(--text)]">
                                {formatTime(step.timestamp)}
                            </div>
                        </div>
                    </div>

                    {step.agentRole && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-[var(--muted)]">Agent:</span>
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--surface-2)] text-[var(--text)]">
                                {step.agentRole}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Step Details */}
            <div className="border-t border-[var(--border)] pt-6">
                {renderStepDetails()}
            </div>
        </div>
    );
}

/**
 * DetailCard component for displaying key-value pairs
 */
interface DetailCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    highlight?: 'success' | 'warning' | 'error';
}

function DetailCard({ label, value, icon, highlight }: DetailCardProps) {
    const getHighlightColor = () => {
        switch (highlight) {
            case 'success':
                return 'bg-[var(--success)]/10 border-[var(--success)]/20 text-[var(--success)]';
            case 'warning':
                return 'bg-[var(--warning)]/10 border-[var(--warning)]/20 text-[var(--warning)]';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-600';
            default:
                return 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)]';
        }
    };

    return (
        <div className={`rounded-xl p-4 border ${getHighlightColor()}`}>
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-xs font-medium opacity-75">{label}</span>
            </div>
            <div className="text-sm font-semibold font-mono truncate" title={String(value)}>
                {value}
            </div>
        </div>
    );
}
