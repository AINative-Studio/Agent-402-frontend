import { RefreshCw, ExternalLink, Copy, Check, Circle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    useCircleWallet,
    getUSDCBalance,
    truncateAddress,
    type CircleWalletWithBalance,
} from '../hooks/useCircleWallet';
import { cn } from '@/lib/utils';

interface CircleWalletBalanceProps {
    /** Project ID for API calls */
    projectId: string;
    /** Agent DID to fetch wallet for */
    agentDid: string;
    /** Optional compact mode for card display */
    compact?: boolean;
    /** Optional custom class name */
    className?: string;
    /** Show refresh button */
    showRefresh?: boolean;
}

/**
 * Format relative time from ISO date string
 */
function formatRelativeTime(dateString: string | undefined): string {
    if (!dateString) return 'Unknown';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

/**
 * Get wallet state badge color
 */
function getWalletStateColor(state: string | undefined): string {
    switch (state) {
        case 'LIVE':
            return 'bg-green-500/10 text-green-400 border-green-500/30';
        case 'FROZEN':
            return 'bg-red-500/10 text-red-400 border-red-500/30';
        case 'PENDING':
            return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
        default:
            return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
}

/**
 * Loading skeleton for Circle wallet display
 */
function CircleWalletSkeleton({ compact }: { compact?: boolean }) {
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-24" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-32" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Error state display
 */
function CircleWalletError({ error, onRetry }: { error: Error; onRetry: () => void }) {
    return (
        <Card className="border-red-500/30">
            <CardContent className="py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400">
                        <Circle className="w-4 h-4" />
                        <span className="text-sm">Failed to load Circle wallet</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRetry}
                        className="text-red-400 hover:text-red-300"
                    >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Retry
                    </Button>
                </div>
                {error.message && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {error.message}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Address display with copy functionality
 */
function AddressDisplay({ address }: { address: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy address:', err);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
                {truncateAddress(address, 6)}
            </span>
            <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={copied ? 'Copied!' : 'Copy address'}
            >
                {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                ) : (
                    <Copy className="w-3 h-3" />
                )}
            </button>
        </div>
    );
}

/**
 * Compact wallet display for inline use
 */
function CompactWalletDisplay({
    wallet,
    className,
}: {
    wallet: CircleWalletWithBalance | null;
    className?: string;
}) {
    if (!wallet) {
        return (
            <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
                <Circle className="w-4 h-4" />
                <span className="text-sm">No Circle wallet</span>
            </div>
        );
    }

    const balance = getUSDCBalance(wallet.balances);

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center">
                <Circle className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-blue-400">
                ${balance}
            </span>
            <span className="text-xs text-muted-foreground">USDC</span>
        </div>
    );
}

/**
 * CircleWalletBalance - Display Circle programmatic wallet balance
 *
 * Features:
 * - USDC balance display
 * - Wallet address with copy functionality
 * - Wallet state indicator
 * - Last updated timestamp
 * - Loading and error states
 * - Compact mode for inline display
 */
export function CircleWalletBalance({
    projectId,
    agentDid,
    compact = false,
    className,
    showRefresh = true,
}: CircleWalletBalanceProps) {
    const { wallet, isLoading, isRefetching, error, refresh } = useCircleWallet(
        projectId,
        agentDid
    );

    if (isLoading) {
        return <CircleWalletSkeleton compact={compact} />;
    }

    if (error) {
        return <CircleWalletError error={error as Error} onRetry={refresh} />;
    }

    // Compact mode
    if (compact) {
        return <CompactWalletDisplay wallet={wallet || null} className={className} />;
    }

    // No wallet found
    if (!wallet) {
        return (
            <Card className={cn('border-dashed', className)}>
                <CardContent className="py-6 text-center">
                    <Circle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                        No Circle wallet found for this agent
                    </p>
                </CardContent>
            </Card>
        );
    }

    const balance = getUSDCBalance(wallet.balances);

    // Full card display
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Circle className="w-4 h-4 text-blue-400" />
                        Circle Wallet
                    </CardTitle>
                    {showRefresh && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refresh}
                            disabled={isRefetching}
                            className="h-8 w-8 p-0"
                            title="Refresh balance"
                        >
                            <RefreshCw
                                className={cn(
                                    'w-4 h-4',
                                    isRefetching && 'animate-spin'
                                )}
                            />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Balance Display */}
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-blue-400">
                        ${balance}
                    </span>
                    <span className="text-sm text-muted-foreground">USDC</span>
                </div>

                {/* Wallet Status */}
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={cn('text-xs', getWalletStateColor(wallet.state))}
                    >
                        {wallet.state || 'Unknown'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {wallet.blockchain || 'Unknown chain'}
                    </span>
                </div>

                {/* Wallet Address */}
                <div className="flex items-center justify-between py-2 border-t border-border">
                    <span className="text-xs text-muted-foreground">Address</span>
                    <div className="flex items-center gap-2">
                        <AddressDisplay address={wallet.address} />
                        {wallet.address && (
                            <a
                                href={`https://polygonscan.com/address/${wallet.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="View on explorer"
                            >
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Updated {formatRelativeTime(wallet.updateDate)}
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * CircleWalletCompact - Simplified inline wallet display
 */
export function CircleWalletCompact({
    projectId,
    agentDid,
    className,
}: {
    projectId: string;
    agentDid: string;
    className?: string;
}) {
    return (
        <CircleWalletBalance
            projectId={projectId}
            agentDid={agentDid}
            compact
            className={className}
            showRefresh={false}
        />
    );
}
