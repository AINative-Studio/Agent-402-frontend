import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { useToolCalls } from '../hooks/useToolCalls';
import { ToolCallTimeline } from '../components/ToolCallTimeline';

export function ToolCalls() {
    const { runId } = useParams<{ runId: string }>();
    const { currentProject } = useProject();

    const { data: toolCalls = [], isLoading } = useToolCalls(currentProject?.project_id, runId);

    if (!currentProject) {
        return (
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
                        <p className="text-[var(--muted)]">Please select a project to view tool calls</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        to={`/runs/${runId}`}
                        className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Run
                    </Link>
                </div>

                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                            <Wrench className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Tool Calls</h1>
                            <p className="text-sm text-[var(--muted)]">
                                Agent tool executions and their results
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-[var(--surface-2)]">
                        <h3 className="text-sm font-semibold mb-2">About Tool Calls</h3>
                        <p className="text-sm text-[var(--muted)]">
                            This view shows all tool invocations made by agents during the run execution.
                            Each tool call includes input parameters, output results, execution timing,
                            and success/failure status. Use the filter to view calls by specific tool types.
                        </p>
                    </div>

                    <ToolCallTimeline toolCalls={toolCalls} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}
