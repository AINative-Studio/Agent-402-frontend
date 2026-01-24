import { useState, useCallback, useEffect, useRef } from 'react';
import {
    ArrowRight,
    ArrowUpRight,
    Check,
    CheckCircle2,
    Circle,
    Copy,
    ExternalLink,
    Loader2,
    Send,
    Wallet,
    XCircle,
    Sparkles,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '../lib/apiClient';
import { useProjectContext } from '../contexts/ProjectContext';
import { cn } from '@/lib/utils';

/**
 * Agent wallet configuration for the demo
 */
interface AgentWallet {
    id: string;
    name: string;
    address: string;
    role: 'analyst' | 'compliance' | 'executor';
}

const AGENT_WALLETS: AgentWallet[] = [
    {
        id: '699e2ea4-f508-5afa-a1bd-5a8f648bedf1',
        name: 'Analyst Agent',
        address: '0x6bd005d0c4970c32f4b6e3b2121785ab1f0dabdb',
        role: 'analyst',
    },
    {
        id: '6a4f70de-aae1-5819-9aa4-7e94084bd2bb',
        name: 'Compliance Agent',
        address: '0x460b48cbc8814a51fc6ad0cef740a44c0eb73fd9',
        role: 'compliance',
    },
    {
        id: '9fe6cff6-e176-5130-a9c2-bfeca5e31008',
        name: 'Transaction Agent',
        address: '0x40889b44ef4ad7bbb921ef68ff9ee7bfbdfbd50e',
        role: 'executor',
    },
];

/**
 * Transfer response from the API
 */
interface TransferResponse {
    transfer_id: string;
    circle_transfer_id?: string;
    status: 'PENDING' | 'COMPLETE' | 'FAILED';
    amount: string;
    source_wallet_id: string;
    destination_wallet_id: string;
    transaction_hash?: string;
    create_date?: string;
}

/**
 * Transfer state for tracking the modal flow
 */
type TransferState = 'form' | 'loading' | 'success' | 'error';

interface CircleTransferModalProps {
    /** Optional trigger element, defaults to a styled button */
    trigger?: React.ReactNode;
    /** Optional callback when transfer completes */
    onTransferComplete?: (transfer: TransferResponse) => void;
    /** Optional custom class name */
    className?: string;
}

/**
 * Truncate wallet address for display
 */
function truncateAddress(address: string, chars: number = 6): string {
    if (!address) return '';
    if (address.length <= chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get role color for visual indicators
 */
function getRoleColor(role: string): string {
    switch (role) {
        case 'analyst':
            return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        case 'compliance':
            return 'text-green-400 bg-green-500/10 border-green-500/30';
        case 'executor':
            return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
        default:
            return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
}

/**
 * Wallet selection item with visual styling
 */
function WalletSelectItem({ wallet }: { wallet: AgentWallet }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center border', getRoleColor(wallet.role))}>
                <Wallet className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
                <span className="font-medium text-sm">{wallet.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                    {truncateAddress(wallet.address, 4)}
                </span>
            </div>
        </div>
    );
}

/**
 * Address display with copy functionality
 */
function AddressWithCopy({ address, label }: { address: string; label?: string }) {
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
            {label && <span className="text-xs text-muted-foreground">{label}:</span>}
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
            <a
                href={`https://testnet.arcscan.app/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="View on Arc Block Explorer"
            >
                <ExternalLink className="w-3 h-3" />
            </a>
        </div>
    );
}

/**
 * Success modal content showing transfer details
 */
function TransferSuccess({
    transfer,
    sourceWallet,
    destWallet,
    amount,
    onClose,
}: {
    transfer: TransferResponse;
    sourceWallet: AgentWallet;
    destWallet: AgentWallet;
    amount: string;
    onClose: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center space-y-4">
                <div className="relative mx-auto w-16 h-16">
                    {transfer.status === 'COMPLETE' ? (
                        <>
                            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                            <div className="relative w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                        </>
                    ) : transfer.status === 'FAILED' ? (
                        <div className="relative w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                            <div className="relative w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30">
                                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                            </div>
                        </>
                    )}
                </div>
                <div>
                    <h3 className={cn(
                        "text-xl font-bold",
                        transfer.status === 'COMPLETE' ? 'text-green-400' :
                        transfer.status === 'FAILED' ? 'text-red-400' : 'text-blue-400'
                    )}>
                        {transfer.status === 'COMPLETE' ? 'Transfer Complete' :
                         transfer.status === 'FAILED' ? 'Transfer Failed' :
                         'Transfer Processing'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {transfer.status === 'COMPLETE'
                            ? 'Your USDC transfer has been confirmed on the blockchain'
                            : transfer.status === 'FAILED'
                            ? 'The transfer could not be completed'
                            : 'Your USDC transfer is being processed...'}
                    </p>
                </div>
            </div>

            {/* Amount Display */}
            <div className="text-center py-4 border-y border-border">
                <div className="flex items-center justify-center gap-2">
                    <Circle className="w-6 h-6 text-blue-400" />
                    <span className="text-4xl font-bold">${amount}</span>
                    <span className="text-lg text-muted-foreground">USDC</span>
                </div>
            </div>

            {/* Transfer Flow Visualization - Vertical Layout */}
            <div className="bg-card/50 rounded-lg p-4 border border-border space-y-3">
                {/* Source Wallet */}
                <div className={cn('p-4 rounded-lg border', getRoleColor(sourceWallet.role))}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <span className="font-semibold">{sourceWallet.name}</span>
                                <p className="text-xs text-muted-foreground">From</p>
                            </div>
                        </div>
                        <AddressWithCopy address={sourceWallet.address} />
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-b from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                        <ArrowRight className="w-4 h-4 text-blue-400 rotate-90" />
                    </div>
                </div>

                {/* Destination Wallet */}
                <div className={cn('p-4 rounded-lg border', getRoleColor(destWallet.role))}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <span className="font-semibold">{destWallet.name}</span>
                                <p className="text-xs text-muted-foreground">To</p>
                            </div>
                        </div>
                        <AddressWithCopy address={destWallet.address} />
                    </div>
                </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Transfer ID</span>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{truncateAddress(transfer.transfer_id, 12)}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(transfer.transfer_id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Transfer ID"
                        >
                            <Copy className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                        variant="outline"
                        className={cn(
                            transfer.status === 'COMPLETE'
                                ? 'bg-green-500/10 text-green-400 border-green-500/30'
                                : transfer.status === 'FAILED'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                        )}
                    >
                        {transfer.status === 'PENDING' && (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        {transfer.status}
                    </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <span className="text-sm flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        ARC Testnet
                    </span>
                </div>
                {transfer.transaction_hash && (
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Tx Hash</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">{truncateAddress(transfer.transaction_hash, 10)}</span>
                            <button
                                onClick={() => navigator.clipboard.writeText(transfer.transaction_hash!)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy Transaction Hash"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Explorer Link - Link to transaction if hash available, otherwise to address */}
            <a
                href={transfer.transaction_hash
                    ? `https://testnet.arcscan.app/tx/${transfer.transaction_hash}`
                    : `https://testnet.arcscan.app/address/${destWallet.address}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 hover:from-blue-500/20 hover:to-purple-500/20 transition-all group"
            >
                <ArrowUpRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                <span className="text-sm font-medium">
                    {transfer.transaction_hash ? 'View Transaction on Arc Explorer' : 'View Wallet on Arc Explorer'}
                </span>
            </a>

            {/* Close Button */}
            <DialogFooter>
                <Button onClick={onClose} className="w-full">
                    Done
                </Button>
            </DialogFooter>
        </div>
    );
}

/**
 * Error state display
 */
function TransferError({
    error,
    onRetry,
    onClose,
}: {
    error: string;
    onRetry: () => void;
    onClose: () => void;
}) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                    <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-red-400">Transfer Failed</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                        {error}
                    </p>
                </div>
            </div>
            <DialogFooter className="gap-2">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={onRetry}>
                    Try Again
                </Button>
            </DialogFooter>
        </div>
    );
}

/**
 * Loading state with animated visualization
 */
function TransferLoading({ amount }: { amount: string }) {
    return (
        <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
                <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse" />
                    <div className="absolute inset-2 bg-blue-500/10 rounded-full animate-ping" />
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Processing Transfer</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sending ${amount} USDC via Circle
                    </p>
                </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Circle className="w-3 h-3 animate-pulse" />
                <span>Signing transaction with Entity Secret...</span>
            </div>
        </div>
    );
}

/**
 * CircleTransferModal - USDC Transfer between agent wallets
 *
 * Features:
 * - Select source and destination from 3 agent wallets
 * - Enter transfer amount
 * - Execute transfer via Circle API
 * - Success modal with transaction details
 * - Link to Arc Block Explorer
 */
export function CircleTransferModal({
    trigger,
    onTransferComplete,
    className,
}: CircleTransferModalProps) {
    const { currentProject } = useProjectContext();
    const [open, setOpen] = useState(false);
    const [transferState, setTransferState] = useState<TransferState>('form');
    const [sourceWalletId, setSourceWalletId] = useState<string>('');
    const [destWalletId, setDestWalletId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [transfer, setTransfer] = useState<TransferResponse | null>(null);

    const sourceWallet = AGENT_WALLETS.find(w => w.id === sourceWalletId);
    const destWallet = AGENT_WALLETS.find(w => w.id === destWalletId);

    const resetForm = useCallback(() => {
        // Clear polling if active
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setTransferState('form');
        setSourceWalletId('');
        setDestWalletId('');
        setAmount('');
        setError('');
        setTransfer(null);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
        // Delay reset to allow close animation
        setTimeout(resetForm, 200);
    }, [resetForm]);

    // Ref for polling interval
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // Poll for transfer status until COMPLETE or FAILED
    const pollTransferStatus = useCallback(async (transferId: string) => {
        if (!currentProject?.project_id) return;

        try {
            const response = await apiClient.get<TransferResponse>(
                `/${currentProject.project_id}/circle/transfers/${transferId}`
            );

            if (response.data.status === 'COMPLETE' || response.data.status === 'FAILED') {
                // Stop polling
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                    pollingRef.current = null;
                }
                // Update transfer with final status
                setTransfer(response.data);
                onTransferComplete?.(response.data);
            }
        } catch (err) {
            console.error('Failed to poll transfer status:', err);
        }
    }, [currentProject?.project_id, onTransferComplete]);

    const handleTransfer = async () => {
        if (!currentProject?.project_id || !sourceWalletId || !destWalletId || !amount) {
            setError('Please fill in all fields');
            return;
        }

        if (sourceWalletId === destWalletId) {
            setError('Source and destination wallets must be different');
            return;
        }

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setTransferState('loading');
        setError('');

        try {
            const response = await apiClient.post<TransferResponse>(
                `/${currentProject.project_id}/circle/transfers`,
                {
                    source_wallet_id: sourceWalletId,
                    destination_wallet_id: destWalletId,
                    amount: amountNum.toString(),
                }
            );

            setTransfer(response.data);
            setTransferState('success');

            // If status is PENDING, start polling for updates
            // Use circle_transfer_id for polling as it's more reliable
            if (response.data.status === 'PENDING') {
                const pollId = response.data.circle_transfer_id || response.data.transfer_id;
                pollingRef.current = setInterval(() => {
                    pollTransferStatus(pollId);
                }, 2000); // Poll every 2 seconds
            } else {
                onTransferComplete?.(response.data);
            }
        } catch (err: unknown) {
            console.error('Transfer failed:', err);
            const errorMessage = err && typeof err === 'object' && 'detail' in err
                ? (err as { detail: string }).detail
                : 'Transfer failed. Please try again.';
            setError(errorMessage);
            setTransferState('error');
        }
    };

    const handleRetry = () => {
        setTransferState('form');
        setError('');
    };

    const isFormValid = sourceWalletId && destWalletId && amount && sourceWalletId !== destWalletId;

    // Available destination wallets (exclude source)
    const availableDestinations = AGENT_WALLETS.filter(w => w.id !== sourceWalletId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className={cn('gap-2', className)}>
                        <Send className="w-4 h-4" />
                        Transfer USDC
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                {transferState === 'form' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                                    <Circle className="w-4 h-4 text-blue-400" />
                                </div>
                                Circle USDC Transfer
                            </DialogTitle>
                            <DialogDescription>
                                Transfer USDC between agent wallets on Polygon Amoy Testnet
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {/* Source Wallet */}
                            <div className="space-y-2">
                                <Label htmlFor="source">From Wallet</Label>
                                <Select value={sourceWalletId} onValueChange={setSourceWalletId}>
                                    <SelectTrigger id="source">
                                        <SelectValue placeholder="Select source wallet">
                                            {sourceWallet && <WalletSelectItem wallet={sourceWallet} />}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AGENT_WALLETS.map((wallet) => (
                                            <SelectItem key={wallet.id} value={wallet.id}>
                                                <WalletSelectItem wallet={wallet} />
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Visual Connector */}
                            <div className="flex items-center justify-center py-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-b from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                                    <ArrowRight className="w-4 h-4 text-blue-400 rotate-90" />
                                </div>
                            </div>

                            {/* Destination Wallet */}
                            <div className="space-y-2">
                                <Label htmlFor="destination">To Wallet</Label>
                                <Select
                                    value={destWalletId}
                                    onValueChange={setDestWalletId}
                                    disabled={!sourceWalletId}
                                >
                                    <SelectTrigger id="destination">
                                        <SelectValue placeholder={sourceWalletId ? "Select destination wallet" : "Select source first"}>
                                            {destWallet && <WalletSelectItem wallet={destWallet} />}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDestinations.map((wallet) => (
                                            <SelectItem key={wallet.id} value={wallet.id}>
                                                <WalletSelectItem wallet={wallet} />
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (USDC)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        $
                                    </span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-7"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        USDC
                                    </span>
                                </div>
                            </div>

                            {/* Error Display */}
                            {error && (
                                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleTransfer}
                                disabled={!isFormValid}
                                className="gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Send Transfer
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {transferState === 'loading' && (
                    <TransferLoading amount={amount} />
                )}

                {transferState === 'success' && transfer && sourceWallet && destWallet && (
                    <TransferSuccess
                        transfer={transfer}
                        sourceWallet={sourceWallet}
                        destWallet={destWallet}
                        amount={amount}
                        onClose={handleClose}
                    />
                )}

                {transferState === 'error' && (
                    <TransferError
                        error={error}
                        onRetry={handleRetry}
                        onClose={handleClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Standalone trigger button for the transfer modal
 */
export function CircleTransferButton({
    variant = 'default',
    size = 'default',
    className,
    onTransferComplete,
}: {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    onTransferComplete?: (transfer: TransferResponse) => void;
}) {
    return (
        <CircleTransferModal
            onTransferComplete={onTransferComplete}
            trigger={
                <Button variant={variant} size={size} className={cn('gap-2', className)}>
                    <Send className="w-4 h-4" />
                    Transfer USDC
                </Button>
            }
        />
    );
}

export default CircleTransferModal;
