import { useState, useCallback, useEffect, useRef } from 'react';
import type { AgentMemory, ComplianceEvent, X402Request, ToolCallEvent } from '../lib/types';

export interface ReplayStep {
    id: string;
    timestamp: string;
    type: 'memory' | 'compliance' | 'x402' | 'tool_call';
    agentRole?: string;
    title: string;
    description: string;
    data: AgentMemory | ComplianceEvent | X402Request | ToolCallEvent;
    index: number;
}

export interface ReplayState {
    currentStepIndex: number;
    totalSteps: number;
    isPlaying: boolean;
    playbackSpeed: number;
    currentStep: ReplayStep | null;
    stepsHistory: ReplayStep[];
}

interface UseRunReplayOptions {
    memory: AgentMemory[];
    compliance: ComplianceEvent[];
    x402Requests: X402Request[];
    toolCalls: ToolCallEvent[];
    autoPlay?: boolean;
    initialSpeed?: number;
}

interface UseRunReplayReturn {
    state: ReplayState;
    play: () => void;
    pause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    jumpToStep: (stepIndex: number) => void;
    jumpToAgent: (agentRole: string) => void;
    jumpToNextError: () => void;
    setPlaybackSpeed: (speed: number) => void;
    reset: () => void;
    getCurrentStepData: () => {
        memory: AgentMemory[];
        compliance: ComplianceEvent[];
        x402Requests: X402Request[];
        toolCalls: ToolCallEvent[];
    };
}

/**
 * Custom hook for replaying workflow execution step-by-step.
 * Combines memory, compliance, x402 requests, and tool calls into
 * a chronological timeline that can be navigated with play/pause controls.
 */
export function useRunReplay(options: UseRunReplayOptions): UseRunReplayReturn {
    const {
        memory,
        compliance,
        x402Requests,
        toolCalls,
        autoPlay = false,
        initialSpeed = 1
    } = options;

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(autoPlay);
    const [playbackSpeed, setPlaybackSpeedState] = useState(initialSpeed);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Build chronological timeline of all events
     */
    const buildTimeline = useCallback((): ReplayStep[] => {
        const steps: ReplayStep[] = [];

        // Add memory entries
        memory.forEach((mem, idx) => {
            steps.push({
                id: mem.memory_id || mem.id || `memory-${idx}`,
                timestamp: mem.created_at,
                type: 'memory',
                agentRole: mem.agent_role,
                title: `Memory: ${mem.agent_role || 'Agent'} Entry`,
                description: mem.content.substring(0, 100) + (mem.content.length > 100 ? '...' : ''),
                data: mem,
                index: 0
            });
        });

        // Add compliance events
        compliance.forEach((comp, idx) => {
            steps.push({
                id: comp.event_id || comp.id || `compliance-${idx}`,
                timestamp: comp.created_at,
                type: 'compliance',
                agentRole: 'compliance',
                title: `Compliance: ${comp.event_type}`,
                description: `Risk Score: ${comp.risk_score} | Passed: ${comp.passed ? 'Yes' : 'No'}`,
                data: comp,
                index: 0
            });
        });

        // Add X402 requests
        x402Requests.forEach((x402, idx) => {
            steps.push({
                id: x402.request_id || x402.id || `x402-${idx}`,
                timestamp: x402.created_at || x402.timestamp,
                type: 'x402',
                agentRole: 'transaction',
                title: `X402 Request: ${x402.status}`,
                description: `Task: ${x402.task_id} | Status: ${x402.status}`,
                data: x402,
                index: 0
            });
        });

        // Add tool calls
        toolCalls.forEach((tool, idx) => {
            steps.push({
                id: tool.event_id || `tool-${idx}`,
                timestamp: tool.timestamp || tool.created_at,
                type: 'tool_call',
                agentRole: tool.data.agent_id,
                title: `Tool Call: ${tool.data.tool_name}`,
                description: tool.data.success ? 'Success' : (tool.data.error || 'Executed'),
                data: tool,
                index: 0
            });
        });

        // Sort by timestamp chronologically
        steps.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
        });

        // Update index after sorting
        steps.forEach((step, idx) => {
            step.index = idx;
        });

        return steps;
    }, [memory, compliance, x402Requests, toolCalls]);

    const [timeline, setTimeline] = useState<ReplayStep[]>([]);

    /**
     * Rebuild timeline when data changes
     */
    useEffect(() => {
        const newTimeline = buildTimeline();
        setTimeline(newTimeline);

        // Reset to beginning if timeline changes significantly
        if (currentStepIndex >= newTimeline.length) {
            setCurrentStepIndex(Math.max(0, newTimeline.length - 1));
        }
    }, [memory, compliance, x402Requests, toolCalls, buildTimeline, currentStepIndex]);

    /**
     * Get current step
     */
    const currentStep = timeline[currentStepIndex] || null;

    /**
     * Get all data up to current step
     */
    const getCurrentStepData = useCallback(() => {
        const stepsUpToCurrent = timeline.slice(0, currentStepIndex + 1);

        return {
            memory: stepsUpToCurrent
                .filter(s => s.type === 'memory')
                .map(s => s.data as AgentMemory),
            compliance: stepsUpToCurrent
                .filter(s => s.type === 'compliance')
                .map(s => s.data as ComplianceEvent),
            x402Requests: stepsUpToCurrent
                .filter(s => s.type === 'x402')
                .map(s => s.data as X402Request),
            toolCalls: stepsUpToCurrent
                .filter(s => s.type === 'tool_call')
                .map(s => s.data as ToolCallEvent)
        };
    }, [timeline, currentStepIndex]);

    /**
     * Play control - advance to next step automatically
     */
    const play = useCallback(() => {
        if (currentStepIndex >= timeline.length - 1) {
            // Reset to beginning if at the end
            setCurrentStepIndex(0);
        }
        setIsPlaying(true);
    }, [currentStepIndex, timeline.length]);

    /**
     * Pause control
     */
    const pause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    /**
     * Step forward
     */
    const stepForward = useCallback(() => {
        setCurrentStepIndex(prev => Math.min(prev + 1, timeline.length - 1));
    }, [timeline.length]);

    /**
     * Step backward
     */
    const stepBackward = useCallback(() => {
        setCurrentStepIndex(prev => Math.max(prev - 1, 0));
    }, []);

    /**
     * Jump to specific step
     */
    const jumpToStep = useCallback((stepIndex: number) => {
        const validIndex = Math.max(0, Math.min(stepIndex, timeline.length - 1));
        setCurrentStepIndex(validIndex);
        setIsPlaying(false);
    }, [timeline.length]);

    /**
     * Set playback speed
     */
    const setPlaybackSpeed = useCallback((speed: number) => {
        const validSpeed = Math.max(0.25, Math.min(speed, 4));
        setPlaybackSpeedState(validSpeed);
    }, []);

    /**
     * Reset to beginning
     */
    const reset = useCallback(() => {
        setCurrentStepIndex(0);
        setIsPlaying(false);
    }, []);

    /**
     * Jump to first step of a specific agent
     */
    const jumpToAgent = useCallback((agentRole: string) => {
        const stepIndex = timeline.findIndex(
            step => step.agentRole?.toLowerCase() === agentRole.toLowerCase()
        );

        if (stepIndex !== -1) {
            setCurrentStepIndex(stepIndex);
            setIsPlaying(false);
        }
    }, [timeline]);

    /**
     * Jump to next error in the timeline
     */
    const jumpToNextError = useCallback(() => {
        // Find next error step after current position
        const errorIndex = timeline.findIndex((step, idx) => {
            if (idx <= currentStepIndex) return false;

            // Check for compliance failures
            if (step.type === 'compliance') {
                const compData = step.data as ComplianceEvent;
                if (compData.passed === false) return true;
            }

            // Check for tool call failures
            if (step.type === 'tool_call') {
                const toolData = step.data as ToolCallEvent;
                if (toolData.data?.success === false) return true;
            }

            return false;
        });

        if (errorIndex !== -1) {
            setCurrentStepIndex(errorIndex);
            setIsPlaying(false);
        } else {
            // If no error found after current position, try from beginning
            const errorFromStart = timeline.findIndex(step => {
                if (step.type === 'compliance') {
                    const compData = step.data as ComplianceEvent;
                    if (compData.passed === false) return true;
                }
                if (step.type === 'tool_call') {
                    const toolData = step.data as ToolCallEvent;
                    if (toolData.data?.success === false) return true;
                }
                return false;
            });

            if (errorFromStart !== -1) {
                setCurrentStepIndex(errorFromStart);
                setIsPlaying(false);
            }
        }
    }, [timeline, currentStepIndex]);

    /**
     * Auto-advance when playing
     */
    useEffect(() => {
        if (!isPlaying || timeline.length === 0) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Calculate interval based on playback speed
        // Base interval is 1000ms, adjusted by speed
        const interval = 1000 / playbackSpeed;

        intervalRef.current = setInterval(() => {
            setCurrentStepIndex(prev => {
                if (prev >= timeline.length - 1) {
                    // Reached the end, stop playing
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, playbackSpeed, timeline.length]);

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return {
        state: {
            currentStepIndex,
            totalSteps: timeline.length,
            isPlaying,
            playbackSpeed,
            currentStep,
            stepsHistory: timeline
        },
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
    };
}
