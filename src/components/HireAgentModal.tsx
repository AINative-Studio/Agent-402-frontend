import { useState } from 'react';
import { Bot, DollarSign, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '../hooks/useWallet';
import { useHireAgent } from '../hooks/useBlockchain';
import { cn } from '@/lib/utils';

/**
 * Agent info for the modal
 */
interface AgentInfo {
    tokenId: number;
    name: string;
    role: string;
    did: string;
    trustTier: number;
    hourlyRate?: number;
}

interface HireAgentModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when modal is closed */
    onClose: () => void;
    /** Agent to hire */
    agent: AgentInfo | null;
    /** Callback when hire is successful */
    onSuccess?: () => void;
}

/**
 * Trust tier labels
 */
const TRUST_TIER_LABELS = ['Unverified', 'Novice', 'Trusted', 'Verified', 'Expert'];

/**
 * Estimated price calculation (mock)
 */
function calculateEstimatedPrice(agent: AgentInfo, taskLength: number): number {
    const baseRate = agent.hourlyRate || 25;
    const tierMultiplier = 1 + (agent.trustTier * 0.1);
    const lengthEstimate = Math.ceil(taskLength / 100) * 0.5;
    return Math.max(10, baseRate * tierMultiplier * lengthEstimate);
}

/**
 * HireAgentModal - Modal for hiring an agent
 *
 * Features:
 * - Agent selection display
 * - Task description input
 * - Quoted price display
 * - USDC payment confirmation
 */
export function HireAgentModal({
    open,
    onClose,
    agent,
    onSuccess,
}: HireAgentModalProps) {
    const { isConnected, usdcBalance } = useWallet();
    const { hireAgent, isPending, isConfirming, isSuccess, error } = useHireAgent();

    const [taskDescription, setTaskDescription] = useState('');
    const [customPrice, setCustomPrice] = useState<string>('');

    // Calculate estimated price based on task
    const estimatedPrice = agent
        ? calculateEstimatedPrice(agent, taskDescription.length)
        : 0;

    // Use custom price if set, otherwise use estimated
    const finalPrice = customPrice ? parseFloat(customPrice) : estimatedPrice;

    // Parse USDC balance
    const availableBalance = parseFloat(usdcBalance.replace(' USDC', '')) || 0;
    const hasInsufficientFunds = finalPrice > availableBalance;

    const handleSubmit = async () => {
        if (!agent || !taskDescription.trim()) return;

        try {
            await hireAgent(
                agent.tokenId,
                taskDescription,
                BigInt(Math.floor(finalPrice * 1e6)) // Convert to USDC units (6 decimals)
            );
            onSuccess?.();
        } catch (err) {
            console.error('Failed to hire agent:', err);
        }
    };

    const handleClose = () => {
        setTaskDescription('');
        setCustomPrice('');
        onClose();
    };

    // Success state
    if (isSuccess) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Agent Hired Successfully</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {agent?.name} has been assigned to your task.
                        </p>
                        <Button onClick={handleClose}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        Hire Agent
                    </DialogTitle>
                    <DialogDescription>
                        Submit a task to the agent. Payment will be held in escrow until completion.
                    </DialogDescription>
                </DialogHeader>

                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
                        <p className="text-sm text-muted-foreground">
                            Please connect your wallet to hire an agent.
                        </p>
                    </div>
                ) : agent ? (
                    <div className="space-y-6 py-4">
                        {/* Agent Info */}
                        <div className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">{agent.name}</h4>
                                    <Badge variant="secondary">{agent.role}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono truncate">
                                    {agent.did}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                        {TRUST_TIER_LABELS[agent.trustTier] || 'Unknown'}
                                    </Badge>
                                    {agent.hourlyRate && (
                                        <span className="text-xs text-muted-foreground">
                                            ~${agent.hourlyRate}/hr
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Task Description */}
                        <div className="space-y-2">
                            <Label htmlFor="task" className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                Task Description
                            </Label>
                            <Textarea
                                id="task"
                                placeholder="Describe the task you want the agent to perform..."
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                Be specific about your requirements for accurate pricing.
                            </p>
                        </div>

                        {/* Price Section */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                Payment (USDC)
                            </Label>

                            {/* Estimated Price */}
                            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <span className="text-sm text-muted-foreground">
                                    Estimated Price:
                                </span>
                                <span className="font-semibold">
                                    ${estimatedPrice.toFixed(2)} USDC
                                </span>
                            </div>

                            {/* Custom Price Input */}
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    placeholder="Custom amount"
                                    value={customPrice}
                                    onChange={(e) => setCustomPrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="flex-1"
                                />
                                <span className="text-sm text-muted-foreground">USDC</span>
                            </div>

                            {/* Balance Check */}
                            <div className={cn(
                                'flex items-center justify-between text-sm',
                                hasInsufficientFunds && 'text-destructive'
                            )}>
                                <span>Your Balance:</span>
                                <span className="font-mono">{usdcBalance}</span>
                            </div>

                            {hasInsufficientFunds && (
                                <p className="text-xs text-destructive">
                                    Insufficient USDC balance for this transaction.
                                </p>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm text-destructive">
                                    {error.message || 'Failed to submit transaction'}
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isPending || isConfirming}>
                        Cancel
                    </Button>
                    {isConnected && agent && (
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                !taskDescription.trim() ||
                                hasInsufficientFunds ||
                                isPending ||
                                isConfirming
                            }
                        >
                            {isPending || isConfirming ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isConfirming ? 'Confirming...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-4 h-4" />
                                    Pay ${finalPrice.toFixed(2)} USDC
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
