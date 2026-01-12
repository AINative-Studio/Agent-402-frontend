import { useState, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, ChevronDown, ChevronRight, Filter, Wrench } from 'lucide-react';
import type { ToolCallEvent } from '../lib/types';

interface ToolCallTimelineProps {
    toolCalls: ToolCallEvent[];
    isLoading?: boolean;
}

export function ToolCallTimeline({ toolCalls, isLoading }: ToolCallTimelineProps) {
    const [selectedTool, setSelectedTool] = useState<string>('all');
    const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

    const uniqueTools = useMemo(() => {
        const tools = new Set(toolCalls.map(call => call.data.tool_name));
        return Array.from(tools).sort();
    }, [toolCalls]);

    const filteredCalls = useMemo(() => {
        if (selectedTool === 'all') return toolCalls;
        return toolCalls.filter(call => call.data.tool_name === selectedTool);
    }, [toolCalls, selectedTool]);

    const toggleExpanded = (eventId: string) => {
        setExpandedCalls(prev => {
            const next = new Set(prev);
            if (next.has(eventId)) {
                next.delete(eventId);
            } else {
                next.add(eventId);
            }
            return next;
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const formatDuration = (ms?: number) => {
        if (!ms) return 'N/A';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const getStatusIcon = (call: ToolCallEvent) => {
        if (call.data.error) {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }
        if (call.data.success !== false) {
            return <CheckCircle className="w-5 h-5 text-[var(--success)]" />;
        }
        return <Clock className="w-5 h-5 text-[var(--muted)]" />;
    };

    const getStatusBadge = (call: ToolCallEvent) => {
        if (call.data.error) {
            return (
                <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-medium">
                    Failed
                </span>
            );
        }
        if (call.data.success !== false) {
            return (
                <span className="px-2 py-1 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium">
                    Success
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--muted)] text-xs font-medium">
                Pending
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-[var(--surface-2)] rounded-xl" />
                <div className="h-32 bg-[var(--surface-2)] rounded-xl" />
                <div className="h-32 bg-[var(--surface-2)] rounded-xl" />
            </div>
        );
    }

    if (toolCalls.length === 0) {
        return (
            <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                <Wrench className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Tool Calls</h3>
                <p className="text-sm text-[var(--muted)]">
                    No tool executions have been recorded for this run
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Filter className="w-4 h-4" />
                    <span>Filter by tool:</span>
                </div>
                <select
                    value={selectedTool}
                    onChange={(e) => setSelectedTool(e.target.value)}
                    className="px-4 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                    <option value="all">All Tools ({toolCalls.length})</option>
                    {uniqueTools.map(tool => (
                        <option key={tool} value={tool}>
                            {tool} ({toolCalls.filter(c => c.data.tool_name === tool).length})
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-4">
                {filteredCalls.map((call, index) => {
                    const isExpanded = expandedCalls.has(call.event_id);
                    const hasResult = call.data.result && Object.keys(call.data.result).length > 0;
                    const hasParams = call.data.parameters && Object.keys(call.data.parameters).length > 0;

                    return (
                        <div
                            key={call.event_id}
                            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden"
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center">
                                            {getStatusIcon(call)}
                                        </div>
                                        {index < filteredCalls.length - 1 && (
                                            <div className="w-0.5 h-12 bg-[var(--border)] my-2" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold font-mono text-sm">
                                                        {call.data.tool_name}
                                                    </h3>
                                                    {getStatusBadge(call)}
                                                </div>
                                                <p className="text-xs text-[var(--muted)] font-mono">
                                                    Agent: {call.data.agent_id}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-mono text-[var(--muted)] mb-1">
                                                    {formatTime(call.timestamp)}
                                                </div>
                                                {call.data.duration_ms !== undefined && (
                                                    <div className="text-xs text-[var(--muted)]">
                                                        Duration: {formatDuration(call.data.duration_ms)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {call.data.error && (
                                            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                                <div className="text-xs font-medium text-red-500 mb-1">
                                                    Error
                                                </div>
                                                <pre className="text-xs font-mono text-red-500 whitespace-pre-wrap">
                                                    {call.data.error}
                                                </pre>
                                            </div>
                                        )}

                                        {(hasParams || hasResult) && (
                                            <button
                                                onClick={() => toggleExpanded(call.event_id)}
                                                className="mt-3 flex items-center gap-2 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                                {isExpanded ? 'Hide' : 'Show'} Details
                                            </button>
                                        )}

                                        {isExpanded && (
                                            <div className="mt-4 space-y-4">
                                                {hasParams && (
                                                    <div>
                                                        <div className="text-xs font-medium text-[var(--muted)] mb-2">
                                                            Input Parameters
                                                        </div>
                                                        <div className="bg-[var(--surface-2)] rounded-xl p-3 overflow-auto">
                                                            <pre className="text-xs font-mono text-[var(--text)]">
                                                                {JSON.stringify(call.data.parameters, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {hasResult && (
                                                    <div>
                                                        <div className="text-xs font-medium text-[var(--muted)] mb-2">
                                                            Output Result
                                                        </div>
                                                        <div className="bg-[var(--surface-2)] rounded-xl p-3 overflow-auto">
                                                            <pre className="text-xs font-mono text-[var(--text)]">
                                                                {JSON.stringify(call.data.result, null, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}

                                                {call.correlation_id && (
                                                    <div className="text-xs text-[var(--muted)] font-mono">
                                                        Correlation ID: {call.correlation_id}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCalls.length === 0 && selectedTool !== 'all' && (
                <div className="text-center py-8 text-sm text-[var(--muted)]">
                    No tool calls found for {selectedTool}
                </div>
            )}
        </div>
    );
}
