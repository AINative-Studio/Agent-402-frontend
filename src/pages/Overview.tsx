import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProjectStats } from '../hooks/useRuns';
import { useProject } from '../hooks/useProject';
import { appConfig } from '../config/app.config';
import { SkeletonBase } from '../components/skeletons';

export function Overview() {
    const { currentProject } = useProject();
    const { data: stats, isLoading, error, refetch } = useProjectStats(currentProject?.project_id);

    const NoProjectIcon = appConfig.emptyStates.noProject.icon;
    const ErrorIcon = appConfig.emptyStates.error.icon;
    const NoRunsIcon = appConfig.emptyStates.noRuns.icon;

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
                        <p className="text-[var(--muted)] mb-6">{appConfig.emptyStates.noProject.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
                        <SkeletonBase height={36} width="40%" className="mb-4" />
                        <SkeletonBase height={24} width="60%" className="mb-4" />
                        <SkeletonBase height={20} width="80%" className="mb-6" />
                        <SkeletonBase height={48} width={180} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <SkeletonBase width={48} height={48} />
                                </div>
                                <SkeletonBase height={36} width="50%" className="mb-2" />
                                <SkeletonBase height={16} width="70%" />
                            </div>
                        ))}
                    </div>

                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <SkeletonBase height={24} width="30%" className="mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i}>
                                    <SkeletonBase height={20} width="60%" className="mb-2" />
                                    <SkeletonBase height={16} width="90%" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--surface)] border border-[var(--danger)]/20 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                            <ErrorIcon className="w-5 h-5 text-[var(--danger)] mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-[var(--danger)] mb-1">{appConfig.emptyStates.error.title}</h3>
                                <p className="text-sm text-[var(--muted)]">{error instanceof Error ? error.message : appConfig.emptyStates.error.message}</p>
                                <button
                                    onClick={() => refetch()}
                                    className="mt-4 px-4 py-2 bg-[var(--danger)] text-white rounded-lg text-sm font-medium hover:opacity-90"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats || stats.total_runs === 0) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <NoRunsIcon className="w-8 h-8 text-[var(--muted)]" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">{appConfig.emptyStates.noRuns.title}</h2>
                        <p className="text-[var(--muted)] mb-6">{appConfig.emptyStates.noRuns.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--success)]/10 border border-[var(--border)] rounded-2xl p-8">
                    <h1 className="text-3xl font-bold mb-2">{appConfig.overviewHero.title}</h1>
                    <p className="text-lg text-[var(--muted)] mb-6">{appConfig.overviewHero.subtitle}</p>
                    <p className="text-[var(--muted)] mb-6 max-w-3xl">
                        {appConfig.overviewHero.description}
                    </p>
                    {stats.latest_run && (
                        <Link
                            to={`/runs/${stats.latest_run.run_id}`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            View Latest Run
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {appConfig.kpiCards.map((card) => {
                        const Icon = card.icon;
                        const value = card.getValue(stats);
                        return (
                            <div key={card.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 bg-[var(--${card.color})]/10 rounded-xl flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 text-[var(--${card.color})]`} />
                                    </div>
                                </div>
                                <div className="text-3xl font-bold mb-1">{value}</div>
                                <div className="text-sm text-[var(--muted)]">{card.label}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">System Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {appConfig.systemFeatures.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title}>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <Icon className={`w-4 h-4 text-[var(--${feature.iconColor})]`} />
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-[var(--muted)]">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
