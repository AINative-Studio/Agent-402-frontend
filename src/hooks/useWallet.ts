import { useAccount, useBalance, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { arcTestnet } from '../lib/wagmiConfig';
import { contracts } from '../lib/contracts';

/**
 * USDC contract address on Arc Testnet
 * In production, this would be the actual USDC contract
 */
const USDC_ADDRESS = (import.meta.env.VITE_USDC_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

/**
 * USDC token ABI (ERC-20 balanceOf)
 */
const usdcAbi = [
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'decimals',
        inputs: [],
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
    },
] as const;

interface WalletState {
    /** Connected wallet address */
    address: `0x${string}` | undefined;
    /** Whether wallet is connected */
    isConnected: boolean;
    /** Whether wallet is currently connecting */
    isConnecting: boolean;
    /** Whether wallet is currently reconnecting */
    isReconnecting: boolean;
    /** Current chain ID */
    chainId: number | undefined;
    /** Whether on Arc Testnet */
    isCorrectNetwork: boolean;
    /** Native token balance (ARC) */
    nativeBalance: string;
    /** USDC balance */
    usdcBalance: string;
    /** Whether data is loading */
    isLoading: boolean;
    /** Switch to Arc Testnet */
    switchToArcTestnet: () => Promise<void>;
    /** Truncated address for display */
    displayAddress: string;
}

/**
 * useWallet - Custom hook for wallet state and actions
 *
 * Provides:
 * - Connected address and connection state
 * - Network information and auto-switch capability
 * - Native token (ARC) and USDC balances
 * - Truncated address for UI display
 */
export function useWallet(): WalletState {
    const { address, isConnected, isConnecting, isReconnecting } = useAccount();
    const chainId = useChainId();
    const { switchChainAsync } = useSwitchChain();

    // Check if on correct network
    const isCorrectNetwork = chainId === arcTestnet.id;

    // Get native token balance
    const { data: nativeBalanceData, isLoading: isNativeLoading } = useBalance({
        address,
        query: {
            enabled: isConnected && !!address,
        },
    });

    // Get USDC balance
    const { data: usdcBalanceData, isLoading: isUsdcLoading } = useReadContract({
        address: USDC_ADDRESS,
        abi: usdcAbi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: isConnected && !!address && USDC_ADDRESS !== '0x0000000000000000000000000000000000000000',
        },
    });

    // Format native balance
    const nativeBalance = nativeBalanceData
        ? `${parseFloat(formatUnits(nativeBalanceData.value, 18)).toFixed(4)} ${nativeBalanceData.symbol}`
        : '0 ARC';

    // Format USDC balance (6 decimals)
    const usdcBalance = usdcBalanceData
        ? `${parseFloat(formatUnits(usdcBalanceData as bigint, 6)).toFixed(2)} USDC`
        : '0.00 USDC';

    // Switch to Arc Testnet
    const switchToArcTestnet = async () => {
        if (switchChainAsync) {
            try {
                await switchChainAsync({ chainId: arcTestnet.id });
            } catch (error) {
                console.error('Failed to switch network:', error);
            }
        }
    };

    // Generate truncated address for display
    const displayAddress = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : '';

    return {
        address,
        isConnected,
        isConnecting,
        isReconnecting,
        chainId,
        isCorrectNetwork,
        nativeBalance,
        usdcBalance,
        isLoading: isNativeLoading || isUsdcLoading,
        switchToArcTestnet,
        displayAddress,
    };
}

/**
 * useAgentRegistry - Hook for reading AgentRegistry contract data
 */
export function useAgentRegistry() {
    const { data: totalAgents, isLoading } = useReadContract({
        address: contracts.agentRegistry.address,
        abi: contracts.agentRegistry.abi,
        functionName: 'totalAgents',
    });

    return {
        totalAgents: totalAgents ? Number(totalAgents) : 0,
        isLoading,
    };
}

/**
 * useAgentTreasury - Hook for reading AgentTreasury contract data
 */
export function useAgentTreasury() {
    const { data: totalTreasuries, isLoading: isTreasuriesLoading } = useReadContract({
        address: contracts.agentTreasury.address,
        abi: contracts.agentTreasury.abi,
        functionName: 'totalTreasuries',
    });

    const { data: totalPayments, isLoading: isPaymentsLoading } = useReadContract({
        address: contracts.agentTreasury.address,
        abi: contracts.agentTreasury.abi,
        functionName: 'totalPayments',
    });

    return {
        totalTreasuries: totalTreasuries ? Number(totalTreasuries) : 0,
        totalPayments: totalPayments ? Number(totalPayments) : 0,
        isLoading: isTreasuriesLoading || isPaymentsLoading,
    };
}

/**
 * useReputationRegistry - Hook for reading ReputationRegistry contract data
 */
export function useReputationRegistry() {
    const { data: totalFeedbacks, isLoading } = useReadContract({
        address: contracts.reputationRegistry.address,
        abi: contracts.reputationRegistry.abi,
        functionName: 'totalFeedbacks',
    });

    return {
        totalFeedbacks: totalFeedbacks ? Number(totalFeedbacks) : 0,
        isLoading,
    };
}
