import { DollarSign, Clock, ArrowUpRight, Wallet } from 'lucide-react';
import { formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTreasuryByAgent, useTreasuryBalance, usePaymentHistory } from '../hooks/useBlockchain';
import { cn } from '@/lib/utils';

interface TreasuryBalanceProps {
    /** Agent token ID from the registry */
    agentTokenId: number;
    /** Optional compact mode for card display */
    compact?: boolean;
    /** Optional custom class name */
    className?: string;
    /** Show payment history */
    showHistory?: boolean;
}

/**
 * Format USDC balance (6 decimals)
 */
function formatUSDC(balance: bigint | undefined): string {
    if (balance === undefined) return '0.00';
    return parseFloat(formatUnits(balance, 6)).toFixed(2);
}

/**
 * Format timestamp to relative time
 */
function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
}

/**
 * Loading skeleton for treasury display
 */
function TreasurySkeleton({ compact, showHistory }: { compact?: boolean; showHistory?: boolean }) {
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-20" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-10 w-32" />
                {showHistory && (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Payment history item component
 */
function PaymentItem({
    payment,
}: {
    payment: {
        id: string;
        from: string;
        amount: string;
        task: string;
        timestamp: string;
    };
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4 text-green-400" />
                </div>
                <div>
                    <div className="text-sm font-medium">{payment.task}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(payment.timestamp)}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-sm font-semibold text-green-400">
                    +${payment.amount}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                    {payment.from}
                </div>
            </div>
        </div>
    );
}

/**
 * TreasuryBalance - Display balance from AgentTreasury contract
 *
 * Features:
 * - USDC balance formatted display
 * - Recent payment history
 * - Compact mode for inline display
 */
export function TreasuryBalance({
    agentTokenId,
    compact = false,
    className,
    showHistory = true,
}: TreasuryBalanceProps) {
    // Get treasury ID for the agent
    const { treasuryId, isLoading: isTreasuryIdLoading } = useTreasuryByAgent(agentTokenId);

    // Get treasury balance
    const { balance, isLoading: isBalanceLoading } = useTreasuryBalance(treasuryId);

    // Get payment history
    const { payments, isLoading: isHistoryLoading } = usePaymentHistory(agentTokenId);

    const isLoading = isTreasuryIdLoading || isBalanceLoading;

    if (isLoading) {
        return <TreasurySkeleton compact={compact} showHistory={showHistory} />;
    }

    const formattedBalance = formatUSDC(balance);

    // Compact mode for card display
    if (compact) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <div className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-green-400" />
                </div>
                <span className="text-sm font-semibold text-green-400">
                    ${formattedBalance}
                </span>
                <span className="text-xs text-muted-foreground">USDC</span>
            </div>
        );
    }

    // Full treasury card
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-400" />
                    Treasury
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Balance Display */}
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-green-400">
                        ${formattedBalance}
                    </span>
                    <span className="text-sm text-muted-foreground">USDC</span>
                </div>

                {/* Treasury Status */}
                {treasuryId !== undefined ? (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Treasury Active (ID: {treasuryId})
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        No treasury created yet
                    </div>
                )}

                {/* Payment History */}
                {showHistory && payments.length > 0 && (
                    <div className="pt-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Recent Payments
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {isHistoryLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : (
                                payments.slice(0, 5).map((payment) => (
                                    <PaymentItem key={payment.id} payment={payment} />
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {showHistory && payments.length === 0 && !isHistoryLoading && (
                    <div className="text-xs text-muted-foreground text-center py-4">
                        No payments received yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
