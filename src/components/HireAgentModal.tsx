import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, DollarSign, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '../hooks/useWallet';
import { useHireAgent } from '../hooks/useBlockchain';
import { agentHireSchema, type AgentHireFormData } from '../lib/validations';
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
 * HireAgentModal - Modal for hiring an agent with form validation
 *
 * Features:
 * - react-hook-form integration with Zod validation
 * - Agent selection display
 * - Task description input with validation
 * - Quoted price display
 * - USDC payment confirmation
 * - Success/error states
 */
export function HireAgentModal({
    open,
    onClose,
    agent,
    onSuccess,
}: HireAgentModalProps) {
    const { isConnected, usdcBalance } = useWallet();
    const { hireAgent, isPending, isConfirming, isSuccess, error } = useHireAgent();

    const form = useForm<AgentHireFormData>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(agentHireSchema) as any,
        defaultValues: {
            agentTokenId: agent?.tokenId || 0,
            taskDescription: '',
            customPrice: null,
        },
    });

    const watchTaskDescription = form.watch('taskDescription');
    const watchCustomPrice = form.watch('customPrice');

    // Update agent token ID when agent changes
    useEffect(() => {
        if (agent) {
            form.setValue('agentTokenId', agent.tokenId);
        }
    }, [agent, form]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            form.reset({
                agentTokenId: agent?.tokenId || 0,
                taskDescription: '',
                customPrice: null,
            });
        }
    }, [open, agent, form]);

    // Calculate estimated price based on task
    const estimatedPrice = useMemo(() => {
        if (!agent) return 0;
        return calculateEstimatedPrice(agent, watchTaskDescription?.length || 0);
    }, [agent, watchTaskDescription]);

    // Use custom price if set, otherwise use estimated
    const finalPrice = watchCustomPrice || estimatedPrice;

    // Parse USDC balance
    const availableBalance = parseFloat(usdcBalance.replace(' USDC', '')) || 0;
    const hasInsufficientFunds = finalPrice > availableBalance;

    const onSubmit = async (data: AgentHireFormData) => {
        if (!agent) return;

        const price = data.customPrice || estimatedPrice;

        try {
            await hireAgent(
                agent.tokenId,
                data.taskDescription,
                BigInt(Math.floor(price * 1e6)) // Convert to USDC units (6 decimals)
            );
            onSuccess?.();
        } catch (err) {
            console.error('Failed to hire agent:', err);
        }
    };

    const handleClose = () => {
        form.reset();
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
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                            <FormField
                                control={form.control}
                                name="taskDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            Task Description
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the task you want the agent to perform..."
                                                rows={4}
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Be specific about your requirements for accurate pricing.
                                            ({watchTaskDescription?.length || 0}/2000 characters)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Price Section */}
                            <div className="space-y-3">
                                <FormLabel className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    Payment (USDC)
                                </FormLabel>

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
                                <FormField
                                    control={form.control}
                                    name="customPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Custom amount"
                                                        min="0"
                                                        step="0.01"
                                                        className="flex-1"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            field.onChange(val ? parseFloat(val) : null);
                                                        }}
                                                    />
                                                </FormControl>
                                                <span className="text-sm text-muted-foreground">USDC</span>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isPending || isConfirming}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
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
                            </DialogFooter>
                        </form>
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
