import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { useRuns } from '../hooks/useRuns';
import { useProject } from '../hooks/useProject';
import { appConfig } from '../config/app.config';
import { SkeletonBase } from '../components/skeletons';

export function RunsList() {
    const { currentProject } = useProject();
    const { data: runs = [], isLoading, error } = useRuns(currentProject?.project_id);

    const NoProjectIcon = appConfig.emptyStates.noProject.icon;
    const ErrorIcon = appConfig.emptyStates.error.icon;
    const NoRunsIcon = appConfig.emptyStates.noRuns.icon;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Handle no project selected
    if (!currentProject) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <NoProjectIcon className="w-8 h-8 text-[var(--muted)]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">{appConfig.emptyStates.noProject.title}</h2>
                        <p className="text-[var(--muted)]">{appConfig.emptyStates.noProject.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Handle loading state
    if (isLoading) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Workflow Runs</h1>
                        <p className="text-[var(--muted)]">Select a run to view detailed execution timeline and data</p>
                    </div>

                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <SkeletonBase height={24} width={200} />
                                            <SkeletonBase height={24} width={80} />
                                        </div>
                                        <SkeletonBase height={16} width={150} />
                                    </div>
                                    <SkeletonBase width={20} height={20} />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {[...Array(3)].map((_, j) => (
                                        <div key={j} className="flex items-center gap-3">
                                            <SkeletonBase width={40} height={40} />
                                            <div className="flex-1">
                                                <SkeletonBase height={24} width="40%" className="mb-1" />
                                                <SkeletonBase height={12} width="60%" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Handle error state
    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-[var(--danger)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ErrorIcon className="w-8 h-8 text-[var(--danger)]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">{appConfig.emptyStates.error.title}</h2>
                        <p className="text-[var(--muted)]">{error instanceof Error ? error.message : appConfig.emptyStates.error.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (runs.length === 0) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <NoRunsIcon className="w-8 h-8 text-[var(--muted)]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">{appConfig.emptyStates.noRuns.title}</h2>
                        <p className="text-[var(--muted)]">{appConfig.emptyStates.noRuns.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Workflow Runs</h1>
                    <p className="text-[var(--muted)]">Select a run to view detailed execution timeline and data</p>
                </div>

                <div className="space-y-4">
                    {runs.map((run) => {
                        const statusColor = appConfig.helpers.getStatusColor(run.status);
                        const runDetailTabs = appConfig.runDetailTabs.slice(1);

                        return (
                            <Link
                                key={run.run_id}
                                to={`/runs/${run.run_id}`}
                                className="block bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)]/40 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold font-mono">{run.run_id}</h3>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-[var(--${statusColor})]/10 text-[var(--${statusColor})]`}>
                                                {run.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                                            <Calendar className="w-4 h-4" />
                                            {run.created_at ? formatDate(run.created_at) : 'N/A'}
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-[var(--muted)]" />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {runDetailTabs.map((tab) => {
                                        const Icon = tab.icon;
                                        let count = 0;
                                        if (tab.label.includes('X402')) count = run.x402_count || 0;
                                        else if (tab.label.includes('Memory')) count = run.memory_count || 0;
                                        else if (tab.label.includes('Compliance')) count = run.compliance_count || 0;

                                        const color = tab.label.includes('X402') ? 'primary' :
                                                     tab.label.includes('Memory') ? 'warning' : 'success';

                                        return (
                                            <div key={tab.label} className="flex items-center gap-3">
                                                <div className={`w-10 h-10 bg-[var(--${color})]/10 rounded-xl flex items-center justify-center`}>
                                                    <Icon className={`w-5 h-5 text-[var(--${color})]`} />
                                                </div>
                                                <div>
                                                    <div className="text-xl font-semibold">{count}</div>
                                                    <div className="text-xs text-[var(--muted)]">{tab.label}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
