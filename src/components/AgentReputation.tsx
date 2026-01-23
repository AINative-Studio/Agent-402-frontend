import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentReputationSummary } from '../hooks/useBlockchain';
import { cn } from '@/lib/utils';

interface AgentReputationProps {
    /** Agent token ID from the registry */
    agentTokenId: number;
    /** Optional compact mode for card display */
    compact?: boolean;
    /** Optional custom class name */
    className?: string;
}

/**
 * Trust tier labels and colors
 */
const TRUST_TIERS = [
    { label: 'Unverified', color: 'secondary', stars: 0 },
    { label: 'Novice', color: 'info', stars: 1 },
    { label: 'Trusted', color: 'success', stars: 2 },
    { label: 'Verified', color: 'success', stars: 3 },
    { label: 'Expert', color: 'warning', stars: 4 },
] as const;

/**
 * Format score for display (from contract's int256 representation)
 */
function formatScore(score: bigint): string {
    const num = Number(score);
    if (num >= 0) {
        return `+${num}`;
    }
    return num.toString();
}

/**
 * Get trend icon based on average score
 */
function getTrendIcon(averageScore: bigint) {
    const avg = Number(averageScore);
    if (avg > 0) {
        return <TrendingUp className="w-4 h-4 text-green-400" />;
    }
    if (avg < 0) {
        return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />;
}

/**
 * Star rating display component
 */
function StarRating({ tier, size = 'default' }: { tier: number; size?: 'default' | 'sm' }) {
    const maxStars = 4;
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: maxStars }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        iconSize,
                        i < tier
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground/30'
                    )}
                />
            ))}
        </div>
    );
}

/**
 * Loading skeleton for reputation display
 */
function ReputationSkeleton({ compact }: { compact?: boolean }) {
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * AgentReputation - Display reputation from ReputationRegistry contract
 *
 * Features:
 * - Trust tier visualization (0-4 stars)
 * - Total score display with trend indicator
 * - Positive/negative feedback breakdown
 * - Compact mode for inline display
 */
export function AgentReputation({
    agentTokenId,
    compact = false,
    className,
}: AgentReputationProps) {
    const { summary, isLoading, error } = useAgentReputationSummary(agentTokenId);

    if (isLoading) {
        return <ReputationSkeleton compact={compact} />;
    }

    if (error) {
        return (
            <div className={cn('text-sm text-destructive', className)}>
                Failed to load reputation
            </div>
        );
    }

    // Default values if no reputation data yet
    const trustTier = summary?.trustTier ?? 0;
    const totalScore = summary?.totalScore ?? BigInt(0);
    const feedbackCount = summary?.feedbackCount ?? BigInt(0);
    const averageScore = summary?.averageScore ?? BigInt(0);

    const tierInfo = TRUST_TIERS[trustTier] || TRUST_TIERS[0];

    // Compact mode for card display
    if (compact) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <StarRating tier={trustTier} size="sm" />
                <Badge variant={tierInfo.color as 'secondary' | 'info' | 'success' | 'warning'}>
                    {tierInfo.label}
                </Badge>
                {Number(feedbackCount) > 0 && (
                    <span className="text-xs text-muted-foreground">
                        ({Number(feedbackCount)} reviews)
                    </span>
                )}
            </div>
        );
    }

    // Full reputation card
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    Reputation
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Trust Tier and Stars */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <StarRating tier={trustTier} />
                        <Badge variant={tierInfo.color as 'secondary' | 'info' | 'success' | 'warning'}>
                            {tierInfo.label}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                        {getTrendIcon(averageScore)}
                        <span className={cn(
                            'font-mono font-medium',
                            Number(averageScore) > 0 && 'text-green-400',
                            Number(averageScore) < 0 && 'text-red-400',
                            Number(averageScore) === 0 && 'text-muted-foreground'
                        )}>
                            {formatScore(averageScore)} avg
                        </span>
                    </div>
                </div>

                {/* Score and Feedback Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                            Total Score
                        </div>
                        <div className={cn(
                            'text-lg font-semibold font-mono',
                            Number(totalScore) > 0 && 'text-green-400',
                            Number(totalScore) < 0 && 'text-red-400',
                            Number(totalScore) === 0 && 'text-foreground'
                        )}>
                            {formatScore(totalScore)}
                        </div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">
                            Total Feedback
                        </div>
                        <div className="text-lg font-semibold">
                            {Number(feedbackCount)}
                        </div>
                    </div>
                </div>

                {/* Tier Progress */}
                {trustTier < 4 && (
                    <div className="text-xs text-muted-foreground">
                        {Number(feedbackCount) === 0 ? (
                            'No feedback yet. Complete tasks to build reputation.'
                        ) : (
                            `${4 - trustTier} tier${4 - trustTier > 1 ? 's' : ''} until Expert status`
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
