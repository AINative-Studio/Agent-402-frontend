import { useState } from 'react';
import { Bot, Wallet, Users, TrendingUp, DollarSign, Shield, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AgentReputation } from '../components/AgentReputation';
import { TreasuryBalance } from '../components/TreasuryBalance';
import { HireAgentModal } from '../components/HireAgentModal';
import { FeedbackForm } from '../components/FeedbackForm';
import { useWallet, useAgentRegistry, useAgentTreasury, useReputationRegistry } from '../hooks/useWallet';
import { cn } from '@/lib/utils';

/**
 * Agent data for display (mock data for demo)
 */
const DEMO_AGENTS = [
    {
        tokenId: 1,
        name: 'Analyst Agent',
        role: 'Market Analyst',
        did: 'did:arc:0x1234567890abcdef1234567890abcdef12345678',
        description: 'Specialized in market analysis, trend identification, and financial data processing.',
        trustTier: 3,
        hourlyRate: 35,
    },
    {
        tokenId: 2,
        name: 'Compliance Agent',
        role: 'Compliance Officer',
        did: 'did:arc:0xabcdef1234567890abcdef1234567890abcdef12',
        description: 'Ensures regulatory compliance, risk assessment, and audit trail generation.',
        trustTier: 4,
        hourlyRate: 50,
    },
    {
        tokenId: 3,
        name: 'Transaction Agent',
        role: 'Transaction Processor',
        did: 'did:arc:0x7890abcdef1234567890abcdef1234567890abcd',
        description: 'Handles secure transaction execution, payment processing, and settlement.',
        trustTier: 2,
        hourlyRate: 25,
    },
];

/**
 * Trust tier badge colors
 */
const TRUST_TIER_VARIANTS: Record<number, 'secondary' | 'info' | 'success' | 'warning'> = {
    0: 'secondary',
    1: 'info',
    2: 'success',
    3: 'success',
    4: 'warning',
};

const TRUST_TIER_LABELS = ['Unverified', 'Novice', 'Trusted', 'Verified', 'Expert'];

/**
 * Truncate DID for display
 */
function truncateDID(did: string): string {
    if (did.length <= 24) return did;
    return `${did.slice(0, 16)}...${did.slice(-8)}`;
}

/**
 * Stats card component
 */
function StatsCard({
    title,
    value,
    icon: Icon,
    description,
    isLoading,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description?: string;
    isLoading?: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Agent dashboard card component
 */
function DashboardAgentCard({
    agent,
    onHire,
    onFeedback,
}: {
    agent: typeof DEMO_AGENTS[0];
    onHire: () => void;
    onFeedback: () => void;
}) {
    const { isConnected } = useWallet();

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{agent.name}</CardTitle>
                            <CardDescription className="text-xs font-mono">
                                {truncateDID(agent.did)}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant={TRUST_TIER_VARIANTS[agent.trustTier] || 'secondary'}>
                        {TRUST_TIER_LABELS[agent.trustTier]}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                {/* Role Badge */}
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{agent.role}</Badge>
                    <span className="text-xs text-muted-foreground">
                        ~${agent.hourlyRate}/hr
                    </span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                    {agent.description}
                </p>

                {/* Reputation Display */}
                <div className="pt-2 border-t border-border">
                    <AgentReputation agentTokenId={agent.tokenId} compact />
                </div>

                {/* Treasury Display */}
                <div className="pt-2 border-t border-border">
                    <TreasuryBalance agentTokenId={agent.tokenId} compact showHistory={false} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={onHire}
                        disabled={!isConnected}
                        className="flex-1"
                        size="sm"
                    >
                        <DollarSign className="w-4 h-4" />
                        Hire
                    </Button>
                    <Button
                        onClick={onFeedback}
                        disabled={!isConnected}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Feedback
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Dashboard - Main agent dashboard page
 *
 * Features:
 * - Grid of 3 AgentCard components
 * - Each card shows: name, role, reputation, treasury
 * - Hire button triggers HireAgentModal
 * - Connected wallet required for actions
 * - Overall blockchain stats
 */
export function Dashboard() {
    const { isConnected, displayAddress, usdcBalance } = useWallet();
    const { totalAgents, isLoading: isAgentsLoading } = useAgentRegistry();
    const { totalTreasuries, totalPayments, isLoading: isTreasuryLoading } = useAgentTreasury();
    const { totalFeedbacks, isLoading: isReputationLoading } = useReputationRegistry();

    const [hireModalOpen, setHireModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<typeof DEMO_AGENTS[0] | null>(null);
    const [feedbackAgent, setFeedbackAgent] = useState<typeof DEMO_AGENTS[0] | null>(null);

    const handleHireClick = (agent: typeof DEMO_AGENTS[0]) => {
        setSelectedAgent(agent);
        setHireModalOpen(true);
    };

    const handleFeedbackClick = (agent: typeof DEMO_AGENTS[0]) => {
        setFeedbackAgent(agent);
    };

    const handleHireSuccess = () => {
        setHireModalOpen(false);
        setSelectedAgent(null);
    };

    const handleFeedbackSuccess = () => {
        setFeedbackAgent(null);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agent Dashboard</h1>
                    <p className="text-muted-foreground">
                        View agent reputation, treasury balances, and hire agents for tasks.
                    </p>
                </div>

                {/* Connection Status */}
                <Card className={cn(
                    'p-4',
                    isConnected ? 'border-green-500/30' : 'border-amber-500/30'
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isConnected ? 'bg-green-500/10' : 'bg-amber-500/10'
                        )}>
                            <Wallet className={cn(
                                'w-5 h-5',
                                isConnected ? 'text-green-500' : 'text-amber-500'
                            )} />
                        </div>
                        <div>
                            {isConnected ? (
                                <>
                                    <div className="text-sm font-medium">{displayAddress}</div>
                                    <div className="text-xs text-green-400">{usdcBalance}</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm font-medium">Not Connected</div>
                                    <div className="text-xs text-muted-foreground">
                                        Connect wallet to hire agents
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Wallet Not Connected Warning */}
            {!isConnected && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="flex items-center gap-4 py-4">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Wallet connection required</p>
                            <p className="text-xs text-muted-foreground">
                                Connect your wallet using the button in the header to hire agents and submit feedback.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Registered Agents"
                    value={totalAgents}
                    icon={Users}
                    description="On Arc Testnet"
                    isLoading={isAgentsLoading}
                />
                <StatsCard
                    title="Active Treasuries"
                    value={totalTreasuries}
                    icon={Wallet}
                    description="Agent wallets"
                    isLoading={isTreasuryLoading}
                />
                <StatsCard
                    title="Total Payments"
                    value={totalPayments}
                    icon={DollarSign}
                    description="Processed transactions"
                    isLoading={isTreasuryLoading}
                />
                <StatsCard
                    title="Total Feedbacks"
                    value={totalFeedbacks}
                    icon={Shield}
                    description="Reputation entries"
                    isLoading={isReputationLoading}
                />
            </div>

            {/* Agents Grid */}
            <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    Available Agents
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {DEMO_AGENTS.map((agent) => (
                        <DashboardAgentCard
                            key={agent.tokenId}
                            agent={agent}
                            onHire={() => handleHireClick(agent)}
                            onFeedback={() => handleFeedbackClick(agent)}
                        />
                    ))}
                </div>
            </div>

            {/* Feedback Form (shown when agent selected) */}
            {feedbackAgent && (
                <div className="max-w-md mx-auto">
                    <FeedbackForm
                        agentTokenId={feedbackAgent.tokenId}
                        agentName={feedbackAgent.name}
                        onSuccess={handleFeedbackSuccess}
                    />
                    <Button
                        variant="ghost"
                        className="w-full mt-2"
                        onClick={() => setFeedbackAgent(null)}
                    >
                        Cancel
                    </Button>
                </div>
            )}

            {/* Hire Agent Modal */}
            <HireAgentModal
                open={hireModalOpen}
                onClose={() => {
                    setHireModalOpen(false);
                    setSelectedAgent(null);
                }}
                agent={selectedAgent}
                onSuccess={handleHireSuccess}
            />
        </div>
    );
}
