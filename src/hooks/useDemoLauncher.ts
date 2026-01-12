import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DemoScenario, DemoRun, DemoConfiguration } from '../lib/types';

// Demo scenarios configuration
const DEMO_SCENARIOS: DemoScenario[] = [
    {
        id: 'market-analysis-demo',
        type: 'market_analysis',
        title: 'Market Analysis Demo',
        description: 'Run a comprehensive market analysis with the Financial Analyst agent. Evaluates market conditions, risk factors, and generates investment recommendations.',
        estimatedDuration: '30-45 seconds',
        complexity: 'simple',
        defaultConfig: {
            scenarioType: 'market_analysis',
            parameters: {
                symbol: 'AAPL',
                timeframe: '1D',
                analysisDepth: 'standard'
            },
            agentConfig: {
                analyst: {
                    model: 'gpt-4',
                    temperature: 0.7,
                    maxTokens: 2000
                }
            },
            mockData: {
                marketPrice: 175.50,
                volume: 1250000,
                sentiment: 'bullish'
            }
        },
        previewData: {
            expectedOutputs: [
                'Market sentiment analysis',
                'Risk assessment score',
                'Investment recommendation',
                'Key metrics and indicators'
            ],
            keyMetrics: [
                { label: 'Agents', value: '1' },
                { label: 'Memory Entries', value: '~3-5' },
                { label: 'Compliance Events', value: '0' }
            ]
        }
    },
    {
        id: 'compliance-check-demo',
        type: 'compliance_check',
        title: 'Compliance Check Demo',
        description: 'Execute a full compliance verification workflow. Includes analysis phase followed by regulatory compliance checks and risk scoring.',
        estimatedDuration: '45-60 seconds',
        complexity: 'moderate',
        defaultConfig: {
            scenarioType: 'compliance_check',
            parameters: {
                transactionType: 'equity_purchase',
                amount: 50000,
                jurisdiction: 'US',
                riskProfile: 'moderate'
            },
            agentConfig: {
                analyst: {
                    model: 'gpt-4',
                    temperature: 0.5
                },
                compliance: {
                    model: 'gpt-4',
                    temperature: 0.3,
                    strictMode: true
                }
            },
            mockData: {
                customerProfile: {
                    kycStatus: 'verified',
                    riskRating: 'low',
                    jurisdiction: 'US'
                }
            }
        },
        previewData: {
            expectedOutputs: [
                'Market analysis results',
                'Compliance risk score',
                'Regulatory checks passed/failed',
                'Audit trail with timestamps'
            ],
            keyMetrics: [
                { label: 'Agents', value: '2' },
                { label: 'Memory Entries', value: '~5-8' },
                { label: 'Compliance Events', value: '~2-4' }
            ]
        }
    },
    {
        id: 'full-transaction-demo',
        type: 'full_transaction',
        title: 'Full Transaction Workflow',
        description: 'Complete end-to-end demonstration including analysis, compliance verification, and cryptographically signed X402 transaction execution.',
        estimatedDuration: '60-90 seconds',
        complexity: 'complex',
        defaultConfig: {
            scenarioType: 'full_transaction',
            parameters: {
                action: 'BUY',
                symbol: 'MSFT',
                quantity: 100,
                orderType: 'MARKET',
                amount: 35000
            },
            agentConfig: {
                analyst: {
                    model: 'gpt-4',
                    temperature: 0.7
                },
                compliance: {
                    model: 'gpt-4',
                    temperature: 0.3,
                    strictMode: true
                },
                transaction: {
                    model: 'gpt-4',
                    temperature: 0.2,
                    signatureRequired: true
                }
            },
            mockData: {
                marketConditions: {
                    volatility: 'low',
                    liquidity: 'high'
                },
                customerProfile: {
                    accountBalance: 100000,
                    tradingLevel: 'standard'
                }
            }
        },
        previewData: {
            expectedOutputs: [
                'Complete market analysis',
                'Compliance verification results',
                'Cryptographically signed X402 request',
                'Transaction execution confirmation',
                'Full audit trail'
            ],
            keyMetrics: [
                { label: 'Agents', value: '3' },
                { label: 'Memory Entries', value: '~8-12' },
                { label: 'Compliance Events', value: '~2-4' },
                { label: 'X402 Requests', value: '~1-2' }
            ]
        }
    }
];

interface LaunchDemoRequest {
    scenarioId: string;
    configuration?: Partial<DemoConfiguration>;
    projectId: string;
}

interface LaunchDemoResponse {
    demoRunId: string;
    runId: string;
    status: string;
    message: string;
}

// Query keys
export const demoKeys = {
    all: ['demos'] as const,
    scenarios: () => [...demoKeys.all, 'scenarios'] as const,
    runs: () => [...demoKeys.all, 'runs'] as const,
    run: (demoRunId: string) => [...demoKeys.runs(), demoRunId] as const,
    history: (projectId: string) => [...demoKeys.runs(), 'history', projectId] as const,
};

/**
 * Custom hook for managing demo launches and demo run state
 */
export function useDemoLauncher(projectId: string | undefined) {
    const queryClient = useQueryClient();
    const [activeDemoRuns, setActiveDemoRuns] = useState<Map<string, DemoRun>>(new Map());

    // Get available demo scenarios
    const getScenarios = useCallback((): DemoScenario[] => {
        return DEMO_SCENARIOS;
    }, []);

    // Get scenario by ID
    const getScenarioById = useCallback((scenarioId: string): DemoScenario | undefined => {
        return DEMO_SCENARIOS.find(s => s.id === scenarioId);
    }, []);

    // Launch demo mutation
    const launchDemoMutation = useMutation({
        mutationFn: async (request: LaunchDemoRequest): Promise<LaunchDemoResponse> => {
            // In a real implementation, this would call the backend API
            // For now, we simulate the API call and create a local demo run

            const scenario = getScenarioById(request.scenarioId);
            if (!scenario) {
                throw new Error(`Scenario not found: ${request.scenarioId}`);
            }

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create a simulated run ID
            const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const demoRunId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            return {
                demoRunId,
                runId,
                status: 'running',
                message: 'Demo launched successfully'
            };
        },
        onSuccess: (response, variables) => {
            const scenario = getScenarioById(variables.scenarioId);
            if (!scenario) return;

            // Create demo run object
            const demoRun: DemoRun = {
                demoRunId: response.demoRunId,
                scenarioId: variables.scenarioId,
                scenarioType: scenario.type,
                runId: response.runId,
                projectId: variables.projectId,
                status: 'running',
                configuration: {
                    ...scenario.defaultConfig,
                    ...variables.configuration
                },
                startedAt: new Date().toISOString(),
                progress: 0,
                currentStep: 'Initializing demo workflow...'
            };

            // Add to active runs
            setActiveDemoRuns(prev => new Map(prev).set(response.demoRunId, demoRun));

            // Start simulating progress (in real app, this would come from backend)
            simulateDemoProgress(demoRun);

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: demoKeys.runs() });
        },
        onError: (error: Error) => {
            console.error('Failed to launch demo:', error);
        }
    });

    // Simulate demo progress (replace with real backend polling/SSE in production)
    const simulateDemoProgress = useCallback((demoRun: DemoRun) => {
        const steps = [
            { progress: 0, step: 'Initializing demo workflow...', duration: 2000 },
            { progress: 20, step: 'Launching analyst agent...', duration: 3000 },
            { progress: 40, step: 'Performing market analysis...', duration: 4000 },
            { progress: 60, step: 'Running compliance checks...', duration: 3000 },
            { progress: 80, step: 'Generating signed transaction...', duration: 2000 },
            { progress: 100, step: 'Demo completed successfully', duration: 1000 }
        ];

        let currentStepIndex = 0;

        const updateProgress = () => {
            if (currentStepIndex >= steps.length) return;

            const step = steps[currentStepIndex];

            setActiveDemoRuns(prev => {
                const updated = new Map(prev);
                const run = updated.get(demoRun.demoRunId);
                if (run) {
                    run.progress = step.progress;
                    run.currentStep = step.step;

                    if (step.progress === 100) {
                        run.status = 'completed';
                        run.completedAt = new Date().toISOString();
                        run.results = {
                            memory_count: Math.floor(Math.random() * 5) + 3,
                            compliance_count: Math.floor(Math.random() * 3) + 1,
                            x402_count: Math.floor(Math.random() * 2) + 1,
                            success: true,
                            summary: `Demo completed successfully for ${demoRun.scenarioType}`
                        };
                    }
                }
                return updated;
            });

            currentStepIndex++;
            if (currentStepIndex < steps.length) {
                setTimeout(updateProgress, step.duration);
            } else {
                // Mark as completed and refresh queries
                queryClient.invalidateQueries({ queryKey: demoKeys.runs() });
            }
        };

        setTimeout(updateProgress, steps[0].duration);
    }, [queryClient]);

    // Get demo run by ID
    const getDemoRun = useCallback((demoRunId: string): DemoRun | undefined => {
        return activeDemoRuns.get(demoRunId);
    }, [activeDemoRuns]);

    // Get all active demo runs
    const getActiveDemoRuns = useCallback((): DemoRun[] => {
        return Array.from(activeDemoRuns.values());
    }, [activeDemoRuns]);

    // Fetch demo history from backend
    const { data: demoHistory, isLoading: isLoadingHistory } = useQuery({
        queryKey: demoKeys.history(projectId!),
        queryFn: async () => {
            // In a real implementation, this would fetch from backend
            // For now, return empty array
            return [] as DemoRun[];
        },
        enabled: !!projectId,
    });

    // Launch a demo
    const launchDemo = useCallback((scenarioId: string, customConfig?: Partial<DemoConfiguration>) => {
        if (!projectId) {
            throw new Error('Project ID is required to launch demo');
        }

        return launchDemoMutation.mutateAsync({
            scenarioId,
            configuration: customConfig,
            projectId
        });
    }, [projectId, launchDemoMutation]);

    return {
        // Scenario management
        scenarios: getScenarios(),
        getScenarioById,

        // Demo launching
        launchDemo,
        isLaunching: launchDemoMutation.isPending,
        launchError: launchDemoMutation.error,

        // Active demo runs
        activeDemoRuns: getActiveDemoRuns(),
        getDemoRun,

        // Demo history
        demoHistory: demoHistory || [],
        isLoadingHistory,
    };
}
