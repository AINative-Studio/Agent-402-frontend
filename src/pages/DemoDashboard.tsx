import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Play,
    TrendingUp,
    Shield,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ArrowRight,
    Eye,
    History,
    Sparkles,
    Code,
    Activity,
    X
} from 'lucide-react';
import { useDemoLauncher } from '../hooks/useDemoLauncher';
import { useProject } from '../hooks/useProject';
import { appConfig } from '../config/app.config';
import type { DemoScenario, DemoRun } from '../lib/types';

export function DemoDashboard() {
    const { currentProject } = useProject();
    const {
        scenarios,
        launchDemo,
        isLaunching,
        launchError,
        activeDemoRuns,
        demoHistory,
        isLoadingHistory
    } = useDemoLauncher(currentProject?.project_id);

    const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
    const [showConfigPreview, setShowConfigPreview] = useState(false);

    const NoProjectIcon = appConfig.emptyStates.noProject.icon;

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

    const handleLaunchDemo = async (scenarioId: string) => {
        try {
            await launchDemo(scenarioId);
        } catch (error) {
            console.error('Failed to launch demo:', error);
        }
    };

    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'simple':
                return 'success';
            case 'moderate':
                return 'warning';
            case 'complex':
                return 'primary';
            default:
                return 'muted';
        }
    };

    const getScenarioIcon = (type: string) => {
        switch (type) {
            case 'market_analysis':
                return TrendingUp;
            case 'compliance_check':
                return Shield;
            case 'full_transaction':
                return DollarSign;
            default:
                return Activity;
        }
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="bg-gradient-to-br from-[var(--primary)]/10 to-[var(--success)]/10 border border-[var(--border)] rounded-2xl p-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-[var(--primary)]" />
                                </div>
                                <h1 className="text-3xl font-bold">Demo Dashboard</h1>
                            </div>
                            <p className="text-lg text-[var(--muted)] mb-4">
                                Launch pre-configured workflow demonstrations with one click
                            </p>
                            <p className="text-[var(--muted)] max-w-3xl">
                                Experience the power of Agent-402 with ready-to-run scenarios. Each demo showcases
                                different aspects of the multi-agent workflow including market analysis, compliance
                                verification, and cryptographically signed transactions.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Launch Error */}
                {launchError && (
                    <div className="bg-[var(--surface)] border border-[var(--danger)]/20 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-[var(--danger)] mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-[var(--danger)] mb-1">Failed to Launch Demo</h3>
                                <p className="text-sm text-[var(--muted)]">
                                    {launchError instanceof Error ? launchError.message : 'An unexpected error occurred'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Demo Runs */}
                {activeDemoRuns.length > 0 && (
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[var(--primary)]" />
                            Active Demo Runs
                        </h2>
                        <div className="space-y-4">
                            {activeDemoRuns.map((demoRun) => (
                                <DemoRunCard key={demoRun.demoRunId} demoRun={demoRun} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Demo Scenarios */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Available Demo Scenarios</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {scenarios.map((scenario) => {
                            const Icon = getScenarioIcon(scenario.type);
                            const complexityColor = getComplexityColor(scenario.complexity);

                            return (
                                <div
                                    key={scenario.id}
                                    className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--primary)]/50 transition-colors"
                                >
                                    {/* Scenario Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-12 h-12 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center`}>
                                            <Icon className="w-6 h-6 text-[var(--primary)]" />
                                        </div>
                                        <div className={`px-3 py-1 bg-[var(--${complexityColor})]/10 rounded-lg`}>
                                            <span className={`text-xs font-medium text-[var(--${complexityColor})] capitalize`}>
                                                {scenario.complexity}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Scenario Info */}
                                    <h3 className="text-lg font-semibold mb-2">{scenario.title}</h3>
                                    <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2">
                                        {scenario.description}
                                    </p>

                                    {/* Duration */}
                                    <div className="flex items-center gap-2 text-sm text-[var(--muted)] mb-4">
                                        <Clock className="w-4 h-4" />
                                        <span>{scenario.estimatedDuration}</span>
                                    </div>

                                    {/* Preview Metrics */}
                                    {scenario.previewData && (
                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {scenario.previewData.keyMetrics.map((metric, idx) => (
                                                <div key={idx} className="text-center p-2 bg-[var(--surface-2)] rounded-lg">
                                                    <div className="text-sm font-semibold">{metric.value}</div>
                                                    <div className="text-xs text-[var(--muted)]">{metric.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleLaunchDemo(scenario.id)}
                                            disabled={isLaunching}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLaunching ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Launching...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4" />
                                                    Launch Demo
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedScenario(scenario);
                                                setShowConfigPreview(true);
                                            }}
                                            className="px-4 py-2.5 bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl font-medium hover:bg-[var(--surface-3)] transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Demo History */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-[var(--muted)]" />
                        Demo History
                    </h2>

                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--muted)]" />
                        </div>
                    ) : demoHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-[var(--surface-2)] rounded-xl flex items-center justify-center mx-auto mb-3">
                                <History className="w-6 h-6 text-[var(--muted)]" />
                            </div>
                            <p className="text-[var(--muted)]">No demo runs yet. Launch a demo to get started!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {demoHistory.map((demoRun) => (
                                <DemoHistoryItem key={demoRun.demoRunId} demoRun={demoRun} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Configuration Preview Modal */}
                {showConfigPreview && selectedScenario && (
                    <ConfigPreviewModal
                        scenario={selectedScenario}
                        onClose={() => {
                            setShowConfigPreview(false);
                            setSelectedScenario(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

// Demo Run Card Component
function DemoRunCard({ demoRun }: { demoRun: DemoRun }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'running':
            case 'launching':
                return 'primary';
            case 'failed':
                return 'danger';
            default:
                return 'warning';
        }
    };

    const statusColor = getStatusColor(demoRun.status);

    return (
        <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                        {demoRun.scenarioType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </h3>
                    <p className="text-sm text-[var(--muted)]">{demoRun.currentStep}</p>
                </div>
                <div className={`px-3 py-1 bg-[var(--${statusColor})]/10 rounded-lg`}>
                    <span className={`text-xs font-medium text-[var(--${statusColor})] capitalize`}>
                        {demoRun.status}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-[var(--muted)] mb-1">
                    <span>Progress</span>
                    <span>{demoRun.progress}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-[var(--${statusColor})] transition-all duration-300`}
                        style={{ width: `${demoRun.progress}%` }}
                    />
                </div>
            </div>

            {/* Results Summary */}
            {demoRun.status === 'completed' && demoRun.results && demoRun.runId && (
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                            <span className="text-[var(--muted)]">Success</span>
                        </div>
                        {demoRun.results.memory_count && (
                            <span className="text-[var(--muted)]">
                                {demoRun.results.memory_count} memories
                            </span>
                        )}
                    </div>
                    <Link
                        to={`/runs/${demoRun.runId}`}
                        className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                        View Details
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            )}
        </div>
    );
}

// Demo History Item Component
function DemoHistoryItem({ demoRun }: { demoRun: DemoRun }) {
    const statusColor = demoRun.status === 'completed' ? 'success' : demoRun.status === 'failed' ? 'danger' : 'primary';

    return (
        <div className="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-xl hover:bg-[var(--surface-3)] transition-colors">
            <div className="flex items-center gap-4">
                <div className={`w-2 h-2 bg-[var(--${statusColor})] rounded-full`} />
                <div>
                    <h4 className="font-medium">
                        {demoRun.scenarioType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </h4>
                    <p className="text-sm text-[var(--muted)]">
                        {new Date(demoRun.startedAt).toLocaleString()}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {demoRun.results && (
                    <div className="text-sm text-[var(--muted)]">
                        {demoRun.results.memory_count} memories • {demoRun.results.compliance_count} compliance
                    </div>
                )}
                {demoRun.runId && (
                    <Link
                        to={`/runs/${demoRun.runId}`}
                        className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                        View
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                )}
            </div>
        </div>
    );
}

// Configuration Preview Modal Component
function ConfigPreviewModal({ scenario, onClose }: { scenario: DemoScenario; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border)]">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{scenario.title}</h2>
                            <p className="text-[var(--muted)]">Configuration Preview</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-lg hover:bg-[var(--surface-2)]"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Expected Outputs */}
                    {scenario.previewData?.expectedOutputs && (
                        <div>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                                Expected Outputs
                            </h3>
                            <ul className="space-y-2">
                                {scenario.previewData.expectedOutputs.map((output, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="text-[var(--primary)] mt-1">•</span>
                                        <span className="text-[var(--muted)]">{output}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Configuration */}
                    <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4 text-[var(--primary)]" />
                            Configuration
                        </h3>
                        <div className="bg-[var(--surface-2)] rounded-xl p-4 overflow-x-auto">
                            <pre className="text-xs text-[var(--muted)] whitespace-pre-wrap">
                                {JSON.stringify(scenario.defaultConfig, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--border)] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[var(--surface-2)] text-[var(--foreground)] rounded-xl font-medium hover:bg-[var(--surface-3)] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
