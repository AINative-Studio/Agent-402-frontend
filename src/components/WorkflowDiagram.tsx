import { ArrowRight, CheckCircle, Circle, XCircle, AlertTriangle } from 'lucide-react';
import type { ReplayStep } from '../hooks/useRunReplay';

interface WorkflowDiagramProps {
    steps: ReplayStep[];
    currentStepIndex: number;
    onStepClick: (stepIndex: number) => void;
}

interface AgentNode {
    agentRole: string;
    steps: number[];
    status: 'pending' | 'active' | 'completed' | 'error';
    firstStepIndex: number;
    lastStepIndex: number;
}

/**
 * WorkflowDiagram visualizes the sequential flow of agents and their handoffs
 * Shows agent transitions, decision points, and current execution state
 */
export function WorkflowDiagram({
    steps,
    currentStepIndex,
    onStepClick
}: WorkflowDiagramProps) {
    /**
     * Build agent nodes from steps
     */
    const buildAgentNodes = (): AgentNode[] => {
        const agentMap = new Map<string, AgentNode>();

        steps.forEach((step, index) => {
            const role = step.agentRole || 'unknown';

            if (!agentMap.has(role)) {
                agentMap.set(role, {
                    agentRole: role,
                    steps: [],
                    status: 'pending',
                    firstStepIndex: index,
                    lastStepIndex: index
                });
            }

            const node = agentMap.get(role)!;
            node.steps.push(index);
            node.lastStepIndex = index;

            // Update status based on current step
            if (index < currentStepIndex) {
                node.status = 'completed';
            } else if (index === currentStepIndex) {
                node.status = 'active';
            }

            // Check for errors in this agent's steps
            if (step.type === 'compliance') {
                const complianceData = step.data as { passed?: boolean };
                if (complianceData.passed === false) {
                    node.status = 'error';
                }
            } else if (step.type === 'tool_call') {
                const toolData = step.data as { data?: { success?: boolean } };
                if (toolData.data?.success === false) {
                    node.status = 'error';
                }
            }
        });

        return Array.from(agentMap.values()).sort((a, b) =>
            a.firstStepIndex - b.firstStepIndex
        );
    };

    const agentNodes = buildAgentNodes();

    /**
     * Get status icon for agent node
     */
    const getStatusIcon = (status: AgentNode['status']) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-[var(--success)]" />;
            case 'active':
                return <Circle className="w-5 h-5 text-[var(--primary)] fill-[var(--primary)]" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'pending':
            default:
                return <Circle className="w-5 h-5 text-[var(--muted)]" />;
        }
    };

    /**
     * Get status color for agent node
     */
    const getStatusColor = (status: AgentNode['status'], isActive: boolean) => {
        if (isActive) {
            return 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg';
        }

        switch (status) {
            case 'completed':
                return 'border-[var(--success)] bg-[var(--success)]/5';
            case 'error':
                return 'border-red-500 bg-red-50';
            case 'pending':
            default:
                return 'border-[var(--border)] bg-[var(--surface-2)]';
        }
    };

    /**
     * Get agent display name
     */
    const getAgentDisplayName = (role: string) => {
        const roleMap: Record<string, string> = {
            'analyst': 'Financial Analyst',
            'compliance': 'Compliance Officer',
            'transaction': 'Transaction Executor',
            'unknown': 'System'
        };

        return roleMap[role.toLowerCase()] || role;
    };

    /**
     * Check if agent node is currently active
     */
    const isNodeActive = (node: AgentNode) => {
        return currentStepIndex >= node.firstStepIndex &&
               currentStepIndex <= node.lastStepIndex;
    };

    /**
     * Get transition label between agents
     */
    const getTransitionLabel = (fromNode: AgentNode, toNode: AgentNode) => {
        const labels: Record<string, Record<string, string>> = {
            'analyst': {
                'compliance': 'Analysis Complete',
                'transaction': 'Direct to Transaction'
            },
            'compliance': {
                'transaction': 'Compliance Approved',
                'analyst': 'Review Required'
            }
        };

        return labels[fromNode.agentRole.toLowerCase()]?.[toNode.agentRole.toLowerCase()] ||
               'Handoff';
    };

    if (agentNodes.length === 0) {
        return (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <p className="text-[var(--muted)] text-center text-sm">
                    No agent workflow to display
                </p>
            </div>
        );
    }

    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6">Agent Workflow Flow</h3>

            {/* Desktop View - Horizontal Flow */}
            <div className="hidden md:block">
                <div className="flex items-center justify-center gap-4">
                    {agentNodes.map((node, index) => {
                        const isActive = isNodeActive(node);
                        const nextNode = agentNodes[index + 1];

                        return (
                            <div key={node.agentRole} className="flex items-center gap-4">
                                {/* Agent Node */}
                                <button
                                    onClick={() => onStepClick(node.firstStepIndex)}
                                    className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all min-w-[200px] ${
                                        getStatusColor(node.status, isActive)
                                    } hover:shadow-md`}
                                    aria-label={`Jump to ${node.agentRole} step`}
                                >
                                    {/* Status Icon */}
                                    <div className="mb-3">
                                        {getStatusIcon(node.status)}
                                    </div>

                                    {/* Agent Name */}
                                    <h4 className="text-sm font-semibold mb-1 text-center">
                                        {getAgentDisplayName(node.agentRole)}
                                    </h4>

                                    {/* Step Count */}
                                    <div className="text-xs text-[var(--muted)] mb-2">
                                        {node.steps.length} step{node.steps.length !== 1 ? 's' : ''}
                                    </div>

                                    {/* Progress Indicator */}
                                    <div className="w-full bg-[var(--surface-2)] rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${
                                                node.status === 'completed'
                                                    ? 'bg-[var(--success)]'
                                                    : node.status === 'active'
                                                    ? 'bg-[var(--primary)]'
                                                    : node.status === 'error'
                                                    ? 'bg-red-500'
                                                    : 'bg-[var(--muted)]'
                                            }`}
                                            style={{
                                                width: `${
                                                    currentStepIndex >= node.lastStepIndex
                                                        ? 100
                                                        : currentStepIndex < node.firstStepIndex
                                                        ? 0
                                                        : ((currentStepIndex - node.firstStepIndex + 1) / node.steps.length) * 100
                                                }%`
                                            }}
                                        />
                                    </div>

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute -top-2 -right-2">
                                            <span className="relative flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-[var(--primary)]"></span>
                                            </span>
                                        </div>
                                    )}

                                    {/* Error Indicator */}
                                    {node.status === 'error' && (
                                        <div className="absolute -top-2 -left-2">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        </div>
                                    )}
                                </button>

                                {/* Transition Arrow */}
                                {nextNode && (
                                    <div className="flex flex-col items-center gap-2">
                                        <ArrowRight
                                            className={`w-8 h-8 ${
                                                currentStepIndex >= node.lastStepIndex
                                                    ? 'text-[var(--primary)]'
                                                    : 'text-[var(--muted)]'
                                            }`}
                                        />
                                        <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                                            {getTransitionLabel(node, nextNode)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile View - Vertical Flow */}
            <div className="md:hidden space-y-4">
                {agentNodes.map((node, index) => {
                    const isActive = isNodeActive(node);
                    const nextNode = agentNodes[index + 1];

                    return (
                        <div key={node.agentRole} className="space-y-3">
                            {/* Agent Node */}
                            <button
                                onClick={() => onStepClick(node.firstStepIndex)}
                                className={`relative w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                    getStatusColor(node.status, isActive)
                                } hover:shadow-md`}
                                aria-label={`Jump to ${node.agentRole} step`}
                            >
                                {/* Status Icon */}
                                <div className="flex-shrink-0">
                                    {getStatusIcon(node.status)}
                                </div>

                                {/* Agent Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold mb-1">
                                        {getAgentDisplayName(node.agentRole)}
                                    </h4>
                                    <div className="text-xs text-[var(--muted)]">
                                        {node.steps.length} step{node.steps.length !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="flex-shrink-0 w-24">
                                    <div className="bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${
                                                node.status === 'completed'
                                                    ? 'bg-[var(--success)]'
                                                    : node.status === 'active'
                                                    ? 'bg-[var(--primary)]'
                                                    : node.status === 'error'
                                                    ? 'bg-red-500'
                                                    : 'bg-[var(--muted)]'
                                            }`}
                                            style={{
                                                width: `${
                                                    currentStepIndex >= node.lastStepIndex
                                                        ? 100
                                                        : currentStepIndex < node.firstStepIndex
                                                        ? 0
                                                        : ((currentStepIndex - node.firstStepIndex + 1) / node.steps.length) * 100
                                                }%`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Indicators */}
                                {isActive && (
                                    <div className="absolute -top-1 -right-1">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
                                        </span>
                                    </div>
                                )}

                                {node.status === 'error' && (
                                    <div className="absolute -top-1 -left-1">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                    </div>
                                )}
                            </button>

                            {/* Transition Indicator */}
                            {nextNode && (
                                <div className="flex items-center gap-2 pl-8">
                                    <div className="w-0.5 h-6 bg-[var(--border)]" />
                                    <span className="text-xs text-[var(--muted)]">
                                        {getTransitionLabel(node, nextNode)}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <div className="flex flex-wrap items-center gap-4 justify-center text-xs text-[var(--muted)]">
                    <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 fill-[var(--primary)] text-[var(--primary)]" />
                        <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Error</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-[var(--muted)]" />
                        <span>Pending</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
