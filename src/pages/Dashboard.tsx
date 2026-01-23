import { useState, useMemo } from 'react';
import { Bot, Users, DollarSign, Shield, AlertTriangle, Calendar, Info, TrendingUp, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { HireAgentModal } from '../components/HireAgentModal';
import { FeedbackForm } from '../components/FeedbackForm';
import { useWallet, useAgentRegistry, useAgentTreasury, useReputationRegistry } from '../hooks/useWallet';
import { cn } from '@/lib/utils';

/**
 * Agent data for display (demo data matching design spec)
 */
const DEMO_AGENTS = [
    {
        tokenId: 0,
        name: 'Financial Analyst',
        role: 'Market Analyst',
        did: 'did:key:z6MkhaXgB2DvotDkL5257f...',
        description: 'Provides market analysis and investment insights',
        trustTier: 0,
        hourlyRate: 35,
        registeredAt: '1/22/2026',
        gradient: 'from-blue-500 to-purple-600',
        icon: TrendingUp,
    },
    {
        tokenId: 1,
        name: 'Compliance Officer',
        role: 'Compliance',
        did: 'did:key:z6Mkl9E8kZT3ybvrYqVqJQ...',
        description: 'Ensures regulatory compliance and risk management',
        trustTier: 0,
        hourlyRate: 50,
        registeredAt: '1/22/2026',
        gradient: 'from-emerald-500 to-teal-600',
        icon: ShieldCheck,
    },
    {
        tokenId: 2,
        name: 'Transaction Agent',
        role: 'Transaction Processor',
        did: 'did:key:z6MkxkQ3EbhjE4VPZqL6LS...',
        description: 'Executes and monitors financial transactions',
        trustTier: 0,
        hourlyRate: 25,
        registeredAt: '1/22/2026',
        gradient: 'from-purple-500 to-pink-600',
        icon: ArrowLeftRight,
    },
];

/**
 * Trust tier labels and colors
 */
const TRUST_TIER_LABELS = ['Untrusted', 'Novice', 'Trusted', 'Verified', 'Expert'];

const TRUST_TIER_COLORS: Record<number, string> = {
    0: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    1: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    2: 'bg-green-500/10 text-green-400 border-green-500/30',
    3: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    4: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

/**
 * Role filter options
 */
const ROLE_OPTIONS = ['All Roles', 'Market Analyst', 'Compliance', 'Transaction Processor'];

/**
 * Trust tier filter options
 */
const TRUST_TIER_OPTIONS = ['All Tiers', 'Unverified', 'Novice', 'Trusted', 'Verified', 'Expert'];

/**
 * Stats card component for the hero section
 */
function StatsCard({
    icon: Icon,
    value,
    label,
}: {
    icon: React.ElementType;
    value: string;
    label: string;
}) {
    return (
        <Card className="rounded-xl bg-card">
            <CardContent className="flex items-center gap-4 p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Agent card component with gradient header
 */
function AgentCard({
    agent,
    onHire,
    onDetails,
}: {
    agent: typeof DEMO_AGENTS[0];
    onHire: () => void;
    onDetails: () => void;
}) {
    const { isConnected } = useWallet();

    return (
        <Card className="overflow-hidden rounded-xl">
            {/* Gradient Header */}
            <div className={cn(
                'h-32 relative bg-gradient-to-br',
                agent.gradient
            )}>
                {/* Agent # Badge */}
                <div className="absolute top-3 left-3">
                    <Badge className="bg-purple-600/80 text-white border-0 text-xs">
                        Agent #{agent.tokenId}
                    </Badge>
                </div>

                {/* Active Badge */}
                <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 text-white border-0 text-xs">
                        Active
                    </Badge>
                </div>

                {/* Centered Agent Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <agent.icon className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <CardContent className="p-5 space-y-4">
                {/* Name and Description */}
                <div>
                    <h3 className="font-bold text-lg">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {agent.description}
                    </p>
                </div>

                {/* Treasury Balance */}
                <div className="flex items-center justify-between py-2 border-y border-border">
                    <span className="text-sm text-muted-foreground">Treasury Balance</span>
                    <span className="font-mono font-medium">0.00 USDC</span>
                </div>

                {/* Trust Tier and Reviews */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn(
                        'border text-xs',
                        TRUST_TIER_COLORS[agent.trustTier]
                    )}>
                        {TRUST_TIER_LABELS[agent.trustTier]}
                    </Badge>
                    <span className="text-sm font-medium">0/10</span>
                    <span className="text-sm text-muted-foreground">(0 reviews)</span>
                </div>

                {/* DID */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">DID:</span>
                    <span className="font-mono text-xs truncate">{agent.did}</span>
                </div>

                {/* Registered Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Registered: {agent.registeredAt}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={onHire}
                        disabled={!isConnected}
                        className="flex-1"
                    >
                        Hire Agent
                    </Button>
                    <Button
                        onClick={onDetails}
                        variant="outline"
                        className="px-4"
                    >
                        <Info className="w-4 h-4" />
                        <span className="ml-2">Details</span>
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
 * - Hero section with title and stats
 * - Filter bar for role and trust tier
 * - Grid of agent cards with gradient headers
 * - Wallet connection integration
 * - Hire agent modal
 */
export function Dashboard() {
    const { isConnected } = useWallet();
    const { totalAgents } = useAgentRegistry();
    // Keep hooks for potential future use with live data
    useAgentTreasury();
    useReputationRegistry();

    // Filter state
    const [roleFilter, setRoleFilter] = useState('All Roles');
    const [trustFilter, setTrustFilter] = useState('All Tiers');

    // Modal state
    const [hireModalOpen, setHireModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<typeof DEMO_AGENTS[0] | null>(null);
    const [feedbackAgent, setFeedbackAgent] = useState<typeof DEMO_AGENTS[0] | null>(null);

    // Filter agents based on selected filters
    const filteredAgents = useMemo(() => {
        return DEMO_AGENTS.filter((agent) => {
            const roleMatch = roleFilter === 'All Roles' || agent.role === roleFilter;
            const trustMatch = trustFilter === 'All Tiers' ||
                TRUST_TIER_LABELS[agent.trustTier] === trustFilter ||
                (trustFilter === 'Unverified' && agent.trustTier === 0);
            return roleMatch && trustMatch;
        });
    }, [roleFilter, trustFilter]);

    const handleHireClick = (agent: typeof DEMO_AGENTS[0]) => {
        setSelectedAgent(agent);
        setHireModalOpen(true);
    };

    const handleDetailsClick = (agent: typeof DEMO_AGENTS[0]) => {
        setFeedbackAgent(agent);
    };

    const handleHireSuccess = () => {
        // Don't close the modal - let it show the success screen
        // User will close it manually after seeing the confirmation
        console.log('Hire success callback triggered');
    };

    const handleFeedbackSuccess = () => {
        setFeedbackAgent(null);
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold">Agent Dashboard</h1>
                <p className="text-muted-foreground">
                    Arc Network Trustless Agent Marketplace
                </p>
            </div>

            {/* Hero Section */}
            <div className="text-center py-8">
                <h2 className="text-4xl font-bold mb-4">Discover AI Agents</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Hire trustless autonomous agents, view their reputation on-chain,
                    and make secure payments with USDC.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatsCard
                    icon={Users}
                    value={String(totalAgents || DEMO_AGENTS.length)}
                    label="Active Agents"
                />
                <StatsCard
                    icon={DollarSign}
                    value="USDC"
                    label="Native Currency"
                />
                <StatsCard
                    icon={Shield}
                    value="On-Chain"
                    label="Reputation"
                />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-y border-border">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">
                            Filter by Role:
                        </label>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium whitespace-nowrap">
                            Filter by Trust Tier:
                        </label>
                        <Select value={trustFilter} onValueChange={setTrustFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Tiers" />
                            </SelectTrigger>
                            <SelectContent>
                                {TRUST_TIER_OPTIONS.map((tier) => (
                                    <SelectItem key={tier} value={tier}>
                                        {tier}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    Showing {filteredAgents.length} of {DEMO_AGENTS.length} agents
                </div>
            </div>

            {/* Wallet Not Connected Warning */}
            {!isConnected && (
                <Card className="border-amber-500/50 bg-amber-500/10">
                    <CardContent className="flex items-center gap-4 py-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Connect Your Wallet</p>
                            <p className="text-sm text-muted-foreground">
                                Connect your wallet to hire agents and submit feedback
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Agents Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAgents.map((agent) => (
                    <AgentCard
                        key={agent.tokenId}
                        agent={agent}
                        onHire={() => handleHireClick(agent)}
                        onDetails={() => handleDetailsClick(agent)}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredAgents.length === 0 && (
                <div className="text-center py-12">
                    <Bot className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Agents Found</h3>
                    <p className="text-muted-foreground">
                        Try adjusting your filters to find available agents.
                    </p>
                </div>
            )}

            {/* Feedback Form (shown when agent selected for details) */}
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
