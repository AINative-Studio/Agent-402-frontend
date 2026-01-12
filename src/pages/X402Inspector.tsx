import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    Key,
    CheckCircle,
    XCircle,
    Copy,
    Filter,
    Download,
    ChevronDown,
    ChevronUp,
    Clock,
    AlertCircle,
    FileText,
    Link as LinkIcon
} from 'lucide-react';
import { useX402Requests, type X402RequestFilters } from '../hooks/useX402';
import { useProject } from '../hooks/useProject';
import { appConfig } from '../config/app.config';
import type { X402Request, X402RequestStatus } from '../lib/types';

const STATUS_OPTIONS: { value: X402RequestStatus | ''; label: string }[] = [
    { value: '', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'COMPLETED', label: 'Completed' }
];

const STATUS_COLORS: Record<X402RequestStatus, { bg: string; text: string; border: string }> = {
    PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/20' },
    APPROVED: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20' },
    REJECTED: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' },
    EXPIRED: { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20' },
    COMPLETED: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20' }
};

export function X402Inspector() {
    const { runId } = useParams<{ runId: string }>();
    const { currentProject } = useProject();

    // Filter state
    const [statusFilter, setStatusFilter] = useState<X402RequestStatus | ''>('');
    const [agentIdFilter, setAgentIdFilter] = useState('');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Build filters object
    const filters: X402RequestFilters = useMemo(() => {
        const f: X402RequestFilters = {};
        if (runId) f.run_id = runId;
        if (statusFilter) f.status = statusFilter;
        if (agentIdFilter.trim()) f.agent_id = agentIdFilter.trim();
        return f;
    }, [runId, statusFilter, agentIdFilter]);

    const { data, isLoading, error } = useX402Requests(currentProject?.project_id, filters);

    // Client-side date filtering (since API doesn't support date range)
    const filteredRequests = useMemo(() => {
        if (!data?.requests) return [];
        let requests = data.requests;

        if (dateFromFilter) {
            const fromDate = new Date(dateFromFilter);
            requests = requests.filter(req => new Date(req.timestamp || req.created_at || '') >= fromDate);
        }

        if (dateToFilter) {
            const toDate = new Date(dateToFilter);
            toDate.setHours(23, 59, 59, 999);
            requests = requests.filter(req => new Date(req.timestamp || req.created_at || '') <= toDate);
        }

        return requests;
    }, [data?.requests, dateFromFilter, dateToFilter]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const truncate = (str: string, length: number = 16) => {
        if (str.length <= length) return str;
        return `${str.slice(0, length / 2)}...${str.slice(-length / 2)}`;
    };

    const exportToJSON = () => {
        const dataStr = JSON.stringify(filteredRequests, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `x402-requests-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const exportToCSV = () => {
        const headers = ['Request ID', 'Agent ID', 'Task ID', 'Status', 'Signature Verified', 'Timestamp', 'Payload'];
        const rows = filteredRequests.map(req => [
            req.request_id,
            req.agent_id,
            req.task_id,
            req.status,
            req.metadata?.signature_verified ? 'Yes' : 'No',
            req.timestamp || req.created_at || '',
            JSON.stringify(req.request_payload)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `x402-requests-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const resetFilters = () => {
        setStatusFilter('');
        setAgentIdFilter('');
        setDateFromFilter('');
        setDateToFilter('');
    };

    const getStatusBadge = (status: X402RequestStatus) => {
        const colors = STATUS_COLORS[status];
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                {status}
            </span>
        );
    };

    const getSignatureVerificationBadge = (request: X402Request) => {
        const verified = request.metadata?.signature_verified === true;
        return verified ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Signature Verified</span>
            </div>
        ) : (
            <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="w-4 h-4" />
                <span>Not Verified</span>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-48 bg-[var(--surface)] rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const ErrorIcon = appConfig.emptyStates.error.icon;
    const NoX402Icon = appConfig.emptyStates.noX402.icon;

    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
                        <ErrorIcon className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
                        <p className="text-[var(--danger)] mb-2">{appConfig.emptyStates.error.title}</p>
                        <p className="text-sm text-[var(--muted)]">{error instanceof Error ? error.message : appConfig.emptyStates.error.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold mb-2">X402 Request Inspector</h2>
                        <p className="text-[var(--muted)]">
                            Cryptographically signed requests with verification status
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            aria-label="Toggle filters"
                        >
                            <Filter className="w-4 h-4" />
                            <span className="hidden sm:inline">Filters</span>
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={exportToJSON}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            aria-label="Export as JSON"
                            disabled={filteredRequests.length === 0}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">JSON</span>
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            aria-label="Export as CSV"
                            disabled={filteredRequests.length === 0}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">CSV</span>
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Filter Requests</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label htmlFor="status-filter" className="block text-sm font-medium mb-2">
                                    Status
                                </label>
                                <select
                                    id="status-filter"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as X402RequestStatus | '')}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                >
                                    {STATUS_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="agent-filter" className="block text-sm font-medium mb-2">
                                    Agent ID
                                </label>
                                <input
                                    id="agent-filter"
                                    type="text"
                                    value={agentIdFilter}
                                    onChange={(e) => setAgentIdFilter(e.target.value)}
                                    placeholder="Enter agent ID or DID"
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                            <div>
                                <label htmlFor="date-from-filter" className="block text-sm font-medium mb-2">
                                    Date From
                                </label>
                                <input
                                    id="date-from-filter"
                                    type="date"
                                    value={dateFromFilter}
                                    onChange={(e) => setDateFromFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                            <div>
                                <label htmlFor="date-to-filter" className="block text-sm font-medium mb-2">
                                    Date To
                                </label>
                                <input
                                    id="date-to-filter"
                                    type="date"
                                    value={dateToFilter}
                                    onChange={(e) => setDateToFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                        <div className="text-sm text-[var(--muted)] mb-1">Total</div>
                        <div className="text-2xl font-bold">{filteredRequests.length}</div>
                    </div>
                    {STATUS_OPTIONS.slice(1).map(option => {
                        const count = filteredRequests.filter(r => r.status === option.value).length;
                        return (
                            <div key={option.value} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                                <div className="text-sm text-[var(--muted)] mb-1">{option.label}</div>
                                <div className="text-2xl font-bold">{count}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Requests List */}
                {filteredRequests.length === 0 ? (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center">
                        <NoX402Icon className="w-12 h-12 text-[var(--muted)] mx-auto mb-4" />
                        <p className="text-[var(--muted)]">{appConfig.emptyStates.noX402.message}</p>
                        {(statusFilter || agentIdFilter || dateFromFilter || dateToFilter) && (
                            <button
                                onClick={resetFilters}
                                className="mt-4 text-[var(--primary)] hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRequests.map((request: X402Request) => (
                            <div
                                key={request.request_id || request.id}
                                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6"
                            >
                                {/* Header Row */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                request.metadata?.signature_verified
                                                    ? 'bg-[var(--success)]/10'
                                                    : 'bg-[var(--danger)]/10'
                                            }`}>
                                                {request.metadata?.signature_verified ? (
                                                    <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold truncate">
                                                        {truncate(request.request_id, 24)}
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(request.request_id)}
                                                        className="p-1 hover:bg-[var(--surface-2)] rounded flex-shrink-0"
                                                        aria-label="Copy request ID"
                                                    >
                                                        <Copy className="w-3 h-3 text-[var(--muted)]" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(request.timestamp || request.created_at || '').toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start sm:items-end gap-2">
                                        {getStatusBadge(request.status)}
                                        {getSignatureVerificationBadge(request)}
                                    </div>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <div className="text-xs text-[var(--muted)] mb-1">Agent ID</div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono truncate">{truncate(request.agent_id, 20)}</code>
                                            <button
                                                onClick={() => copyToClipboard(request.agent_id)}
                                                className="p-1 hover:bg-[var(--surface-2)] rounded flex-shrink-0"
                                                aria-label="Copy agent ID"
                                            >
                                                <Copy className="w-3 h-3 text-[var(--muted)]" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-[var(--muted)] mb-1">Task ID</div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono truncate">{truncate(request.task_id, 20)}</code>
                                            <button
                                                onClick={() => copyToClipboard(request.task_id)}
                                                className="p-1 hover:bg-[var(--surface-2)] rounded flex-shrink-0"
                                                aria-label="Copy task ID"
                                            >
                                                <Copy className="w-3 h-3 text-[var(--muted)]" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-[var(--muted)] mb-1">Run ID</div>
                                        <div className="flex items-center gap-2">
                                            <code className="text-sm font-mono truncate">{truncate(request.run_id, 20)}</code>
                                            <button
                                                onClick={() => copyToClipboard(request.run_id)}
                                                className="p-1 hover:bg-[var(--surface-2)] rounded flex-shrink-0"
                                                aria-label="Copy run ID"
                                            >
                                                <Copy className="w-3 h-3 text-[var(--muted)]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Linked Records */}
                                {(request.linked_memory_ids.length > 0 || request.linked_compliance_ids.length > 0) && (
                                    <div className="mb-4 flex flex-wrap gap-4 text-sm">
                                        {request.linked_memory_ids.length > 0 && (
                                            <div className="flex items-center gap-2 text-[var(--muted)]">
                                                <LinkIcon className="w-4 h-4" />
                                                <span>{request.linked_memory_ids.length} memory record{request.linked_memory_ids.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                        {request.linked_compliance_ids.length > 0 && (
                                            <div className="flex items-center gap-2 text-[var(--muted)]">
                                                <LinkIcon className="w-4 h-4" />
                                                <span>{request.linked_compliance_ids.length} compliance event{request.linked_compliance_ids.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Signature */}
                                <div className="mb-4">
                                    <div className="text-xs text-[var(--muted)] mb-1">Signature</div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm font-mono truncate flex-1">{truncate(request.signature, 48)}</code>
                                        <button
                                            onClick={() => copyToClipboard(request.signature)}
                                            className="p-1 hover:bg-[var(--surface-2)] rounded flex-shrink-0"
                                            aria-label="Copy signature"
                                        >
                                            <Copy className="w-3 h-3 text-[var(--muted)]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expand/Collapse Button */}
                                <button
                                    onClick={() => setExpandedId(expandedId === request.request_id ? null : request.request_id)}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-[var(--primary)] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                                    aria-label={expandedId === request.request_id ? 'Collapse details' : 'Expand details'}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>{expandedId === request.request_id ? 'Hide Details' : 'Show Details'}</span>
                                    {expandedId === request.request_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                {/* Expanded Details */}
                                {expandedId === request.request_id && (
                                    <div className="mt-4 space-y-4">
                                        {/* Full Signature */}
                                        <div className="bg-[var(--surface-2)] rounded-xl p-4">
                                            <div className="text-xs text-[var(--muted)] mb-2 font-semibold">Full Signature</div>
                                            <code className="text-xs font-mono block break-all">{request.signature}</code>
                                        </div>

                                        {/* Request Payload */}
                                        <div className="bg-[var(--surface-2)] rounded-xl p-4">
                                            <div className="text-xs text-[var(--muted)] mb-2 font-semibold">Request Payload</div>
                                            <pre className="text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap break-words">
                                                {JSON.stringify(request.request_payload, null, 2)}
                                            </pre>
                                        </div>

                                        {/* Metadata */}
                                        {request.metadata && Object.keys(request.metadata).length > 0 && (
                                            <div className="bg-[var(--surface-2)] rounded-xl p-4">
                                                <div className="text-xs text-[var(--muted)] mb-2 font-semibold">Metadata</div>
                                                <pre className="text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap break-words">
                                                    {JSON.stringify(request.metadata, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        <div className="bg-[var(--surface-2)] rounded-xl p-4">
                                            <div className="text-xs text-[var(--muted)] mb-3 font-semibold">Request Timeline</div>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">Request Created</div>
                                                        <div className="text-xs text-[var(--muted)]">
                                                            {new Date(request.timestamp || request.created_at || '').toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                {request.metadata?.signature_verified === true && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">Signature Verified</div>
                                                            <div className="text-xs text-[var(--muted)]">
                                                                ECDSA signature validation passed
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {request.status !== 'PENDING' && (
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                                            request.status === 'APPROVED' || request.status === 'COMPLETED'
                                                                ? 'bg-green-500'
                                                                : request.status === 'REJECTED'
                                                                ? 'bg-red-500'
                                                                : 'bg-gray-500'
                                                        }`}></div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium">Status: {request.status}</div>
                                                            <div className="text-xs text-[var(--muted)]">
                                                                Request processing {request.status.toLowerCase()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
