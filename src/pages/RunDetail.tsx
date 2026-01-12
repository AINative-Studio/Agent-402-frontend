import { useParams, Link, useLocation } from 'react-router-dom';
import { Clock, CheckCircle } from 'lucide-react';
import { useRunById } from '../hooks/useRuns';
import { useX402Requests } from '../hooks/useX402';
import { useComplianceEvents } from '../hooks/useCompliance';
import { useMemories } from '../hooks/useMemory';
import { useToolCalls } from '../hooks/useToolCalls';
import { useProject } from '../hooks/useProject';
import { appConfig } from '../config/app.config';
import { WorkflowVisualization } from '../components/WorkflowVisualization';
import { RunReplay } from '../components/RunReplay';
import { SkeletonBase, SkeletonListCard } from '../components/skeletons';

export function RunDetail() {
    const { runId } = useParams<{ runId: string }>();
    const location = useLocation();
    const { currentProject } = useProject();

    const { data: _run, isLoading: runLoading, error: runError } = useRunById(currentProject?.project_id, runId);
    const { data: x402Response, isLoading: x402Loading } = useX402Requests(currentProject?.project_id, { run_id: runId });
    const { data: memoryResponse, isLoading: memoryLoading } = useMemories(currentProject?.project_id, { runId });
    const { data: compliance = [], isLoading: complianceLoading } = useComplianceEvents(currentProject?.project_id, runId);
    const { data: toolCalls = [], isLoading: toolCallsLoading } = useToolCalls(currentProject?.project_id, runId);

    // Extract arrays from paginated responses
    const x402Requests = x402Response?.requests || [];
    const memory = memoryResponse?.items || [];

    const loading = runLoading || x402Loading || memoryLoading || complianceLoading || toolCallsLoading;

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const currentTab = appConfig.runDetailTabs.find(tab => location.pathname.endsWith(tab.path)) || appConfig.runDetailTabs[0];

    if (!currentProject) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
                        <p className="text-[var(--muted)]">Please select a project to view run details</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header Skeleton */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <SkeletonBase height={32} width="40%" className="mb-4" />
                        <div className="flex items-center gap-4">
                            <SkeletonBase height={24} width={100} />
                            <SkeletonBase height={24} width={150} />
                        </div>
                    </div>

                    {/* Tabs Skeleton */}
                    <div className="flex gap-2">
                        {[...Array(4)].map((_, i) => (
                            <SkeletonBase key={i} height={40} width={120} />
                        ))}
                    </div>

                    {/* Content Skeleton */}
                    <SkeletonListCard items={4} />
                </div>
            </div>
        );
    }

    if (runError) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
                        <p className="text-red-500 mb-2">Error loading run details</p>
                        <p className="text-sm text-[var(--muted)]">{runError.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    const timelineStepsWithData = appConfig.timelineSteps.map((step) => {
        const { time, data } = step.dataSelector({ memory, compliance, x402Requests });
        return {
            ...step,
            time,
            data,
        };
    });

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold font-mono mb-2">{runId}</h1>
                            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                                {appConfig.runDetailTabs.slice(1).map((tab) => {
                                    const Icon = tab.icon;
                                    let count = 0;
                                    if (tab.label.includes('Tool')) count = toolCalls.length;
                                    else if (tab.label.includes('X402')) count = x402Requests.length;
                                    else if (tab.label.includes('Memory')) count = memory.length;
                                    else if (tab.label.includes('Compliance')) count = compliance.length;

                                    return (
                                        <div key={tab.label} className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" />
                                            {count} {tab.label}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-[var(--success)]/10 text-[var(--success)] text-sm font-medium">
                            Completed
                        </div>
                    </div>

                    <nav className="flex gap-2 border-t border-[var(--border)] pt-4">
                        {appConfig.runDetailTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = tab === currentTab;
                            return (
                                <Link
                                    key={tab.path}
                                    to={`/runs/${runId}${tab.path}`}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                        isActive
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Workflow Visualization - Issue #29 */}
                <WorkflowVisualization
                    runId={runId!}
                    projectId={currentProject.project_id || currentProject.id}
                    memory={memory}
                    compliance={compliance}
                    x402Requests={x402Requests}
                    autoStart={true}
                />

                {/* Run Replay - Issue #34 */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-6">Workflow Replay</h2>
                    <RunReplay
                        runId={runId!}
                        memory={memory}
                        compliance={compliance}
                        x402Requests={x402Requests}
                        toolCalls={toolCalls}
                        autoPlay={false}
                    />
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-6">Execution Timeline</h2>
                    <div className="space-y-6">
                        {timelineStepsWithData.map((step, index) => (
                            <div key={index} className="flex gap-6">
                                <div className="flex flex-col items-center">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        step.status === 'completed'
                                            ? 'bg-[var(--success)]/10'
                                            : 'bg-[var(--surface-2)]'
                                    }`}>
                                        {step.status === 'completed' ? (
                                            <CheckCircle className="w-6 h-6 text-[var(--success)]" />
                                        ) : (
                                            <Clock className="w-6 h-6 text-[var(--muted)]" />
                                        )}
                                    </div>
                                    {index < timelineStepsWithData.length - 1 && (
                                        <div className="w-0.5 h-16 bg-[var(--border)] my-2" />
                                    )}
                                </div>

                                <div className="flex-1 pb-8">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold">{step.title}</h3>
                                        {step.time && (
                                            <span className="text-sm text-[var(--muted)] font-mono">
                                                {formatTime(step.time)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[var(--muted)] mb-3">{step.description}</p>

                                    {step.data && (
                                        <details className="bg-[var(--surface-2)] rounded-xl p-4">
                                            <summary className="text-sm font-medium cursor-pointer select-none">
                                                View Details
                                            </summary>
                                            <pre className="mt-3 text-xs font-mono text-[var(--muted)] overflow-auto">
                                                {JSON.stringify(step.data, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
