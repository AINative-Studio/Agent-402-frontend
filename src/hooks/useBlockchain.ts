import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts } from '../lib/contracts';
import type { Address } from 'viem';

/**
 * Agent metadata from the AgentRegistry contract
 */
export interface AgentMetadata {
    did: string;
    role: string;
    publicKey: string;
    registeredAt: bigint;
    active: boolean;
}

/**
 * Reputation summary from the ReputationRegistry contract
 */
export interface ReputationSummary {
    totalScore: bigint;
    feedbackCount: bigint;
    averageScore: bigint;
    trustTier: number;
}

/**
 * Treasury info from the AgentTreasury contract
 */
export interface TreasuryInfo {
    agentTokenId: bigint;
    owner: Address;
    createdAt: bigint;
    active: boolean;
}

/**
 * useAgentMetadata - Get agent metadata by token ID
 */
export function useAgentMetadata(tokenId: number | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contracts.agentRegistry.address,
        abi: contracts.agentRegistry.abi,
        functionName: 'getAgentMetadata',
        args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
        query: {
            enabled: tokenId !== undefined,
        },
    });

    return {
        metadata: data as AgentMetadata | undefined,
        isLoading,
        error,
        refetch,
    };
}

/**
 * useAgentReputationSummary - Get full reputation summary for an agent
 */
export function useAgentReputationSummary(agentTokenId: number | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contracts.reputationRegistry.address,
        abi: contracts.reputationRegistry.abi,
        functionName: 'getAgentReputationSummary',
        args: agentTokenId !== undefined ? [BigInt(agentTokenId)] : undefined,
        query: {
            enabled: agentTokenId !== undefined,
        },
    });

    // Parse the tuple response
    const summary: ReputationSummary | undefined = data ? {
        totalScore: (data as [bigint, bigint, bigint, number])[0],
        feedbackCount: (data as [bigint, bigint, bigint, number])[1],
        averageScore: (data as [bigint, bigint, bigint, number])[2],
        trustTier: Number((data as [bigint, bigint, bigint, number])[3]),
    } : undefined;

    return {
        summary,
        isLoading,
        error,
        refetch,
    };
}

/**
 * useTreasuryBalance - Get treasury balance for an agent
 */
export function useTreasuryBalance(treasuryId: number | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contracts.agentTreasury.address,
        abi: contracts.agentTreasury.abi,
        functionName: 'getTreasuryBalance',
        args: treasuryId !== undefined ? [BigInt(treasuryId)] : undefined,
        query: {
            enabled: treasuryId !== undefined,
        },
    });

    return {
        balance: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
}

/**
 * useTreasuryByAgent - Get treasury ID for an agent token
 */
export function useTreasuryByAgent(agentTokenId: number | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contracts.agentTreasury.address,
        abi: contracts.agentTreasury.abi,
        functionName: 'getTreasuryByAgent',
        args: agentTokenId !== undefined ? [BigInt(agentTokenId)] : undefined,
        query: {
            enabled: agentTokenId !== undefined,
        },
    });

    return {
        treasuryId: data !== undefined ? Number(data) : undefined,
        isLoading,
        error,
        refetch,
    };
}

/**
 * useTreasuryInfo - Get full treasury info
 */
export function useTreasuryInfo(treasuryId: number | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contracts.agentTreasury.address,
        abi: contracts.agentTreasury.abi,
        functionName: 'getTreasury',
        args: treasuryId !== undefined ? [BigInt(treasuryId)] : undefined,
        query: {
            enabled: treasuryId !== undefined,
        },
    });

    return {
        treasury: data as TreasuryInfo | undefined,
        isLoading,
        error,
        refetch,
    };
}

/**
 * useHireAgent - Hook for hiring an agent (write contract)
 * Note: This would require the actual hire function in the contract
 * For now, this is a placeholder that simulates the hire flow
 */
export function useHireAgent() {
    const { data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const hireAgent = async (
        agentTokenId: number,
        taskDescription: string,
        amount: bigint
    ) => {
        // In a real implementation, this would call the actual hire function
        // For demo purposes, we'll log the intent
        console.log('Hire agent:', { agentTokenId, taskDescription, amount });

        // Placeholder: In production, uncomment and use actual contract function
        // writeContract({
        //     address: contracts.agentTreasury.address,
        //     abi: [...], // hire function ABI
        //     functionName: 'hire',
        //     args: [BigInt(agentTokenId), taskDescription],
        //     value: amount,
        // });
    };

    return {
        hireAgent,
        isPending,
        isConfirming,
        isSuccess,
        error,
        txHash: hash,
    };
}

/**
 * useSubmitFeedback - Hook for submitting feedback to ReputationRegistry
 * Note: This would require the actual submitFeedback function in the contract
 */
export function useSubmitFeedback() {
    const { data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const submitFeedback = async (
        agentTokenId: number,
        rating: number,
        comment: string
    ) => {
        // In a real implementation, this would call the actual submitFeedback function
        console.log('Submit feedback:', { agentTokenId, rating, comment });

        // Placeholder: In production, uncomment and use actual contract function
        // writeContract({
        //     address: contracts.reputationRegistry.address,
        //     abi: [...], // submitFeedback function ABI
        //     functionName: 'submitFeedback',
        //     args: [BigInt(agentTokenId), rating, comment],
        // });
    };

    return {
        submitFeedback,
        isPending,
        isConfirming,
        isSuccess,
        error,
        txHash: hash,
    };
}

/**
 * usePaymentHistory - Hook for fetching payment history events
 * Note: This would read events from the AgentTreasury contract
 */
export function usePaymentHistory(agentTokenId: number | undefined) {
    // In a real implementation, this would use useContractEvents or similar
    // For demo purposes, we return mock data

    const mockPayments = agentTokenId !== undefined ? [
        {
            id: '1',
            from: '0x1234...5678',
            amount: '50.00',
            task: 'Market Analysis',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
            id: '2',
            from: '0xabcd...efgh',
            amount: '75.00',
            task: 'Compliance Review',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
        {
            id: '3',
            from: '0x9876...5432',
            amount: '100.00',
            task: 'Transaction Processing',
            timestamp: new Date(Date.now() - 259200000).toISOString(),
        },
    ] : [];

    return {
        payments: mockPayments,
        isLoading: false,
        error: null,
    };
}
