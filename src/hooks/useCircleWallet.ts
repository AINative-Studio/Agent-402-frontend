import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

/**
 * Circle wallet data from the backend API
 */
export interface CircleWallet {
    walletId: string;
    address: string;
    blockchain: string;
    state: 'LIVE' | 'FROZEN' | 'PENDING';
    createDate: string;
    updateDate: string;
}

/**
 * Circle wallet balance information
 */
export interface CircleWalletBalance {
    amount: string;
    currency: string;
}

/**
 * Circle wallet with balance data
 */
export interface CircleWalletWithBalance extends CircleWallet {
    balances: CircleWalletBalance[];
}

/**
 * Circle transfer transaction
 */
export interface CircleTransfer {
    id: string;
    source: {
        type: string;
        id: string;
        address?: string;
    };
    destination: {
        type: string;
        id: string;
        address?: string;
    };
    amount: {
        amount: string;
        currency: string;
    };
    status: 'PENDING' | 'COMPLETE' | 'FAILED';
    transactionHash?: string;
    createDate: string;
    updateDate?: string;
}

/**
 * API response types
 */
interface CircleWalletsResponse {
    wallets: CircleWalletWithBalance[];
}

interface CircleTransfersResponse {
    transfers: CircleTransfer[];
}

/**
 * Query keys for Circle wallet data
 */
export const circleWalletKeys = {
    all: ['circle-wallets'] as const,
    lists: () => [...circleWalletKeys.all, 'list'] as const,
    list: (projectId: string) => [...circleWalletKeys.lists(), projectId] as const,
    byAgent: (projectId: string, agentDid: string) =>
        [...circleWalletKeys.list(projectId), 'agent', agentDid] as const,
    transfers: () => [...circleWalletKeys.all, 'transfers'] as const,
    transfersByWallet: (projectId: string, walletId: string) =>
        [...circleWalletKeys.transfers(), projectId, walletId] as const,
};

/**
 * useCircleWallet - Fetch Circle wallet info for an agent
 *
 * @param projectId - The project ID
 * @param agentDid - The agent's DID
 * @returns Wallet data, loading state, error, and refresh function
 */
export function useCircleWallet(projectId?: string, agentDid?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: circleWalletKeys.byAgent(projectId!, agentDid!),
        queryFn: async () => {
            const { data } = await apiClient.get<CircleWalletsResponse>(
                `/${projectId}/circle/wallets`,
                { params: { agent_did: agentDid } }
            );
            // Return the first wallet for the agent
            return data.wallets?.[0] || null;
        },
        enabled: !!projectId && !!agentDid,
        staleTime: 30000, // Consider data stale after 30 seconds
        refetchInterval: 60000, // Refetch every 60 seconds for balance updates
    });

    const refresh = () => {
        if (projectId && agentDid) {
            queryClient.invalidateQueries({
                queryKey: circleWalletKeys.byAgent(projectId, agentDid)
            });
        }
    };

    return {
        wallet: query.data,
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        error: query.error,
        refresh,
        refetch: query.refetch,
    };
}

/**
 * useCircleWallets - Fetch all Circle wallets for a project
 *
 * @param projectId - The project ID
 * @returns Wallets data, loading state, error, and refresh function
 */
export function useCircleWallets(projectId?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: circleWalletKeys.list(projectId!),
        queryFn: async () => {
            const { data } = await apiClient.get<CircleWalletsResponse>(
                `/${projectId}/circle/wallets`
            );
            return data.wallets || [];
        },
        enabled: !!projectId,
        staleTime: 30000,
        refetchInterval: 60000,
    });

    const refresh = () => {
        if (projectId) {
            queryClient.invalidateQueries({
                queryKey: circleWalletKeys.list(projectId)
            });
        }
    };

    return {
        wallets: query.data || [],
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        error: query.error,
        refresh,
        refetch: query.refetch,
    };
}

/**
 * useCircleTransfers - Fetch Circle transfers for a wallet
 *
 * @param projectId - The project ID
 * @param walletId - The Circle wallet ID
 * @returns Transfers data, loading state, error, and refresh function
 */
export function useCircleTransfers(projectId?: string, walletId?: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: circleWalletKeys.transfersByWallet(projectId!, walletId!),
        queryFn: async () => {
            const { data } = await apiClient.get<CircleTransfersResponse>(
                `/${projectId}/circle/transfers`,
                { params: { wallet_id: walletId } }
            );
            return data.transfers || [];
        },
        enabled: !!projectId && !!walletId,
        staleTime: 30000,
        refetchInterval: 60000,
    });

    const refresh = () => {
        if (projectId && walletId) {
            queryClient.invalidateQueries({
                queryKey: circleWalletKeys.transfersByWallet(projectId, walletId)
            });
        }
    };

    return {
        transfers: query.data || [],
        isLoading: query.isLoading,
        isRefetching: query.isRefetching,
        error: query.error,
        refresh,
        refetch: query.refetch,
    };
}

/**
 * Format USDC amount from string (assumes 6 decimal places)
 */
export function formatCircleUSDC(amount: string | undefined): string {
    if (!amount) return '0.00';
    const value = parseFloat(amount);
    if (isNaN(value)) return '0.00';
    return value.toFixed(2);
}

/**
 * Get USDC balance from wallet balances array
 */
export function getUSDCBalance(balances: CircleWalletBalance[] | undefined): string {
    if (!balances || balances.length === 0) return '0.00';
    const usdcBalance = balances.find(b => b.currency === 'USD' || b.currency === 'USDC');
    return formatCircleUSDC(usdcBalance?.amount);
}

/**
 * Truncate wallet address for display
 */
export function truncateAddress(address: string | undefined, chars: number = 4): string {
    if (!address) return '';
    if (address.length <= chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
