import {
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    RefreshCw,
    ExternalLink,
    Circle,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useCircleTransfers,
    formatCircleUSDC,
    truncateAddress,
    type CircleTransfer,
} from '../hooks/useCircleWallet';
import { cn } from '@/lib/utils';

interface CircleTransactionHistoryProps {
    /** Project ID for API calls */
    projectId: string;
    /** Circle wallet ID to fetch transfers for */
    walletId: string;
    /** Maximum number of transfers to display */
    limit?: number;
    /** Optional custom class name */
    className?: string;
    /** Show header with refresh button */
    showHeader?: boolean;
}

/**
 * Format timestamp to relative time
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
 * Get transfer status icon and color
 */
function getTransferStatus(status: string): {
    icon: React.ReactNode;
    color: string;
    label: string;
} {
    switch (status) {
        case 'COMPLETE':
            return {
                icon: <CheckCircle2 className="w-4 h-4" />,
                color: 'text-green-400',
                label: 'Complete',
            };
        case 'FAILED':
            return {
                icon: <XCircle className="w-4 h-4" />,
                color: 'text-red-400',
                label: 'Failed',
            };
        case 'PENDING':
        default:
            return {
                icon: <Loader2 className="w-4 h-4 animate-spin" />,
                color: 'text-yellow-400',
                label: 'Pending',
            };
    }
}

/**
 * Determine if transfer is incoming or outgoing for a given wallet
 */
function isIncomingTransfer(transfer: CircleTransfer, walletId: string): boolean {
    return transfer.destination?.id === walletId;
}

/**
 * Loading skeleton for transaction history
 */
function TransactionHistorySkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

/**
 * Single transfer item component
 */
function TransferItem({
    transfer,
    walletId,
}: {
    transfer: CircleTransfer;
    walletId: string;
}) {
    const isIncoming = isIncomingTransfer(transfer, walletId);
    const statusInfo = getTransferStatus(transfer.status);
    const amount = formatCircleUSDC(transfer.amount?.amount);
    const currency = transfer.amount?.currency || 'USDC';

    // Get the counterparty address
    const counterparty = isIncoming
        ? transfer.source?.address || transfer.source?.id
        : transfer.destination?.address || transfer.destination?.id;

    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
                {/* Direction Icon */}
                <div
                    className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        isIncoming
                            ? 'bg-green-500/10'
                            : 'bg-orange-500/10'
                    )}
                >
                    {isIncoming ? (
                        <ArrowDownLeft className="w-4 h-4 text-green-400" />
                    ) : (
                        <ArrowUpRight className="w-4 h-4 text-orange-400" />
                    )}
                </div>

                {/* Transfer Details */}
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            {isIncoming ? 'Received' : 'Sent'}
                        </span>
                        <span className={cn('flex items-center gap-1', statusInfo.color)}>
                            {statusInfo.icon}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(transfer.createDate)}
                    </div>
                </div>
            </div>

            {/* Amount and Address */}
            <div className="text-right">
                <div
                    className={cn(
                        'text-sm font-semibold',
                        isIncoming ? 'text-green-400' : 'text-orange-400'
                    )}
                >
                    {isIncoming ? '+' : '-'}${amount} {currency}
                </div>
                <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(counterparty, 4)}
                    </span>
                    {transfer.transactionHash && (
                        <a
                            href={`https://polygonscan.com/tx/${transfer.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="View transaction"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Empty state for no transactions
 */
function EmptyTransactions() {
    return (
        <div className="text-center py-8">
            <Circle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
                No transactions yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
                Transfers will appear here once the wallet receives or sends funds
            </p>
        </div>
    );
}

/**
 * Error state display
 */
function TransactionHistoryError({
    error,
    onRetry,
}: {
    error: Error;
    onRetry: () => void;
}) {
    return (
        <Card className="border-red-500/30">
            <CardContent className="py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Failed to load transactions</span>
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
 * CircleTransactionHistory - Display Circle wallet transaction history
 *
 * Features:
 * - List of incoming and outgoing transfers
 * - Transfer status indicators (pending, complete, failed)
 * - Amount and counterparty display
 * - Transaction hash links to explorer
 * - Loading and error states
 * - Empty state for new wallets
 */
export function CircleTransactionHistory({
    projectId,
    walletId,
    limit = 5,
    className,
    showHeader = true,
}: CircleTransactionHistoryProps) {
    const { transfers, isLoading, isRefetching, error, refresh } = useCircleTransfers(
        projectId,
        walletId
    );

    if (isLoading) {
        return <TransactionHistorySkeleton />;
    }

    if (error) {
        return <TransactionHistoryError error={error as Error} onRetry={refresh} />;
    }

    const displayedTransfers = transfers.slice(0, limit);

    return (
        <Card className={className}>
            {showHeader && (
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            Transaction History
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refresh}
                            disabled={isRefetching}
                            className="h-8 w-8 p-0"
                            title="Refresh transactions"
                        >
                            <RefreshCw
                                className={cn(
                                    'w-4 h-4',
                                    isRefetching && 'animate-spin'
                                )}
                            />
                        </Button>
                    </div>
                </CardHeader>
            )}
            <CardContent className={cn(!showHeader && 'pt-4')}>
                {displayedTransfers.length === 0 ? (
                    <EmptyTransactions />
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {displayedTransfers.map((transfer) => (
                            <TransferItem
                                key={transfer.id}
                                transfer={transfer}
                                walletId={walletId}
                            />
                        ))}
                    </div>
                )}

                {/* Show more indicator */}
                {transfers.length > limit && (
                    <div className="text-center pt-3 border-t border-border mt-3">
                        <span className="text-xs text-muted-foreground">
                            Showing {displayedTransfers.length} of {transfers.length} transactions
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * CircleTransactionList - Inline list without card wrapper
 */
export function CircleTransactionList({
    projectId,
    walletId,
    limit = 5,
    className,
}: {
    projectId: string;
    walletId: string;
    limit?: number;
    className?: string;
}) {
    const { transfers, isLoading, error, refresh } = useCircleTransfers(
        projectId,
        walletId
    );

    if (isLoading) {
        return (
            <div className={cn('space-y-2', className)}>
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn('text-center py-4', className)}>
                <p className="text-sm text-red-400">Failed to load transactions</p>
                <Button
                    variant="link"
                    size="sm"
                    onClick={refresh}
                    className="text-xs"
                >
                    Try again
                </Button>
            </div>
        );
    }

    const displayedTransfers = transfers.slice(0, limit);

    if (displayedTransfers.length === 0) {
        return (
            <div className={cn('text-center py-4', className)}>
                <p className="text-sm text-muted-foreground">No transactions</p>
            </div>
        );
    }

    return (
        <div className={className}>
            {displayedTransfers.map((transfer) => (
                <TransferItem
                    key={transfer.id}
                    transfer={transfer}
                    walletId={walletId}
                />
            ))}
        </div>
    );
}
