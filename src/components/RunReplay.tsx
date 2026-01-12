import { Play, Pause, SkipBack, SkipForward, RotateCcw, Gauge, User, AlertCircle } from 'lucide-react';
import { useRunReplay } from '../hooks/useRunReplay';
import { WorkflowStepViewer } from './WorkflowStepViewer';
import { WorkflowDiagram } from './WorkflowDiagram';
import { PlaybackControls } from './PlaybackControls';
import type { AgentMemory, ComplianceEvent, X402Request, ToolCallEvent } from '../lib/types';

interface RunReplayProps {
    runId: string;
    memory: AgentMemory[];
    compliance: ComplianceEvent[];
    x402Requests: X402Request[];
    toolCalls: ToolCallEvent[];
    autoPlay?: boolean;
}

/**
 * RunReplay component provides step-by-step navigation through
 * workflow execution with play/pause controls, timeline scrubber,
 * and state visualization per step.
 */
export function RunReplay({
    runId,
    memory,
    compliance,
    x402Requests,
    toolCalls,
    autoPlay = false
}: RunReplayProps) {
    const {
        state,
        play,
        pause,
        stepForward,
        stepBackward,
        jumpToStep,
        jumpToAgent,
        jumpToNextError,
        setPlaybackSpeed,
        reset,
        getCurrentStepData
    } = useRunReplay({
        memory,
        compliance,
        x402Requests,
        toolCalls,
        autoPlay
    });

    const currentData = getCurrentStepData();
    const progressPercent = state.totalSteps > 0
        ? ((state.currentStepIndex + 1) / state.totalSteps) * 100
        : 0;

    /**
     * Format timestamp for display
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
     * Get badge color based on step type
     */
    const getStepTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'memory':
                return 'bg-[var(--warning)]/10 text-[var(--warning)]';
            case 'compliance':
                return 'bg-[var(--success)]/10 text-[var(--success)]';
            case 'x402':
                return 'bg-[var(--primary)]/10 text-[var(--primary)]';
            case 'tool_call':
                return 'bg-purple-100 text-purple-600';
            default:
                return 'bg-[var(--surface-2)] text-[var(--muted)]';
        }
    };

    /**
     * Handle timeline scrubber click
     */
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        const stepIndex = Math.floor(percent * state.totalSteps);
        jumpToStep(stepIndex);
    };

    /**
     * Playback speed options
     */
    const speedOptions = [0.25, 0.5, 1, 2, 4];

    /**
     * Get unique agent roles from steps
     */
    const uniqueAgents = Array.from(
        new Set(state.stepsHistory.map(step => step.agentRole).filter(Boolean))
    ) as string[];

    /**
     * Check if there are any errors in the workflow
     */
    const hasErrors = state.stepsHistory.some(step => {
        if (step.type === 'compliance') {
            return (step.data as ComplianceEvent).passed === false;
        }
        if (step.type === 'tool_call') {
            return (step.data as ToolCallEvent).data?.success === false;
        }
        return false;
    });

    if (state.totalSteps === 0) {
        return (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <p className="text-[var(--muted)] text-center">
                    No workflow steps to replay. Execute a workflow to see the replay.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Workflow Diagram */}
            <WorkflowDiagram
                steps={state.stepsHistory}
                currentStepIndex={state.currentStepIndex}
                onStepClick={jumpToStep}
            />

            {/* Replay Controls */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <div className="space-y-4">
                    {/* Control Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            {/* Play/Pause Button */}
                            <button
                                onClick={state.isPlaying ? pause : play}
                                className="w-12 h-12 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                                aria-label={state.isPlaying ? 'Pause' : 'Play'}
                            >
                                {state.isPlaying ? (
                                    <Pause className="w-6 h-6" />
                                ) : (
                                    <Play className="w-6 h-6 ml-0.5" />
                                )}
                            </button>

                            {/* Step Controls */}
                            <button
                                onClick={stepBackward}
                                disabled={state.currentStepIndex === 0}
                                className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center hover:bg-[var(--surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous step"
                            >
                                <SkipBack className="w-5 h-5" />
                            </button>

                            <button
                                onClick={stepForward}
                                disabled={state.currentStepIndex >= state.totalSteps - 1}
                                className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center hover:bg-[var(--surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next step"
                            >
                                <SkipForward className="w-5 h-5" />
                            </button>

                            {/* Reset Button */}
                            <button
                                onClick={reset}
                                className="w-10 h-10 rounded-xl bg-[var(--surface-2)] text-[var(--text)] flex items-center justify-center hover:bg-[var(--surface)] transition-colors"
                                aria-label="Reset to beginning"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>

                            {/* Step Counter */}
                            <div className="ml-4 text-sm font-mono text-[var(--muted)]">
                                Step {state.currentStepIndex + 1} / {state.totalSteps}
                            </div>

                            {/* Jump to Agent */}
                            {uniqueAgents.length > 1 && (
                                <div className="relative ml-4">
                                    <select
                                        onChange={(e) => jumpToAgent(e.target.value)}
                                        className="px-3 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] text-sm appearance-none pr-8 cursor-pointer hover:bg-[var(--surface)] transition-colors"
                                        aria-label="Jump to agent"
                                    >
                                        <option value="">Jump to Agent...</option>
                                        {uniqueAgents.map(agent => (
                                            <option key={agent} value={agent}>
                                                {agent}
                                            </option>
                                        ))}
                                    </select>
                                    <User className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
                                </div>
                            )}

                            {/* Jump to Error */}
                            {hasErrors && (
                                <button
                                    onClick={jumpToNextError}
                                    className="ml-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                                    aria-label="Jump to next error"
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    Jump to Error
                                </button>
                            )}
                        </div>

                        {/* Playback Speed Control */}
                        <div className="flex items-center gap-3">
                            <Gauge className="w-5 h-5 text-[var(--muted)]" />
                            <div className="flex items-center gap-2">
                                {speedOptions.map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            state.playbackSpeed === speed
                                                ? 'bg-[var(--primary)] text-white'
                                                : 'bg-[var(--surface-2)] text-[var(--muted)] hover:bg-[var(--surface)]'
                                        }`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Scrubber */}
                    <div className="space-y-2">
                        <div
                            className="relative h-2 bg-[var(--surface-2)] rounded-full cursor-pointer overflow-hidden"
                            onClick={handleTimelineClick}
                            role="slider"
                            aria-label="Timeline scrubber"
                            aria-valuemin={0}
                            aria-valuemax={state.totalSteps}
                            aria-valuenow={state.currentStepIndex}
                        >
                            {/* Progress Bar */}
                            <div
                                className="absolute top-0 left-0 h-full bg-[var(--primary)] transition-all duration-200"
                                style={{ width: `${progressPercent}%` }}
                            />

                            {/* Step Markers */}
                            {state.stepsHistory.map((step, idx) => (
                                <div
                                    key={step.id}
                                    className={`absolute top-0 h-full w-1 cursor-pointer transition-opacity ${
                                        idx === state.currentStepIndex
                                            ? 'bg-white opacity-100'
                                            : 'bg-[var(--border)] opacity-50 hover:opacity-100'
                                    }`}
                                    style={{ left: `${(idx / state.totalSteps) * 100}%` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        jumpToStep(idx);
                                    }}
                                />
                            ))}
                        </div>

                        {/* Timeline Labels */}
                        <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono">
                            <span>
                                {state.stepsHistory[0] && formatTime(state.stepsHistory[0].timestamp)}
                            </span>
                            <span>
                                {state.stepsHistory[state.totalSteps - 1] &&
                                    formatTime(state.stepsHistory[state.totalSteps - 1].timestamp)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Current Step Details - Enhanced View */}
            {state.currentStep && (
                <WorkflowStepViewer
                    step={state.currentStep}
                    stepNumber={state.currentStepIndex + 1}
                    totalSteps={state.totalSteps}
                />
            )}

            {/* Agent State at Current Step */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Agent State at Step {state.currentStepIndex + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Memory Entries */}
                    <div className="bg-[var(--surface-2)] rounded-xl p-4">
                        <div className="text-sm font-medium text-[var(--muted)] mb-1">Memory Entries</div>
                        <div className="text-2xl font-bold text-[var(--warning)]">
                            {currentData.memory.length}
                        </div>
                        {currentData.memory.length > 0 && (
                            <div className="mt-2 text-xs text-[var(--muted)]">
                                Latest: {currentData.memory[currentData.memory.length - 1].agent_role || 'Unknown'}
                            </div>
                        )}
                    </div>

                    {/* Compliance Events */}
                    <div className="bg-[var(--surface-2)] rounded-xl p-4">
                        <div className="text-sm font-medium text-[var(--muted)] mb-1">Compliance Events</div>
                        <div className="text-2xl font-bold text-[var(--success)]">
                            {currentData.compliance.length}
                        </div>
                        {currentData.compliance.length > 0 && (
                            <div className="mt-2 text-xs text-[var(--muted)]">
                                Risk: {currentData.compliance[currentData.compliance.length - 1].risk_score}
                            </div>
                        )}
                    </div>

                    {/* X402 Requests */}
                    <div className="bg-[var(--surface-2)] rounded-xl p-4">
                        <div className="text-sm font-medium text-[var(--muted)] mb-1">X402 Requests</div>
                        <div className="text-2xl font-bold text-[var(--primary)]">
                            {currentData.x402Requests.length}
                        </div>
                        {currentData.x402Requests.length > 0 && (
                            <div className="mt-2 text-xs text-[var(--muted)]">
                                Status: {currentData.x402Requests[currentData.x402Requests.length - 1].status}
                            </div>
                        )}
                    </div>

                    {/* Tool Calls */}
                    <div className="bg-[var(--surface-2)] rounded-xl p-4">
                        <div className="text-sm font-medium text-[var(--muted)] mb-1">Tool Calls</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {currentData.toolCalls.length}
                        </div>
                        {currentData.toolCalls.length > 0 && (
                            <div className="mt-2 text-xs text-[var(--muted)]">
                                Latest: {currentData.toolCalls[currentData.toolCalls.length - 1].data.tool_name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Jump to Step */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Jump to Step</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {state.stepsHistory.map((step, idx) => (
                        <button
                            key={step.id}
                            onClick={() => jumpToStep(idx)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                                idx === state.currentStepIndex
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'bg-[var(--surface-2)] hover:bg-[var(--surface)] text-[var(--text)]'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-sm font-mono font-medium">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{step.title}</div>
                                        <div className="text-xs opacity-75 truncate">{step.description}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        idx === state.currentStepIndex
                                            ? 'bg-white/20 text-white'
                                            : getStepTypeBadgeColor(step.type)
                                    }`}>
                                        {step.type}
                                    </span>
                                    <span className="text-xs font-mono opacity-75">
                                        {formatTime(step.timestamp).split(' ')[0]}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Export and Share Controls */}
            <PlaybackControls
                steps={state.stepsHistory}
                runId={runId}
                currentStepIndex={state.currentStepIndex}
            />
        </div>
    );
}
