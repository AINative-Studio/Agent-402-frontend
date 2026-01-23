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
 * useHireAgent - Hook for hiring an agent with USDC payment
 *
 * Calls fundTreasury on the AgentTreasury contract to pay an agent.
 * On Arc Testnet, USDC is the native currency, so we send value with the transaction.
 */
export function useHireAgent() {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * Hire an agent by funding their treasury
     * @param agentTokenId - The agent's NFT token ID
     * @param _taskDescription - Task description (stored off-chain, used for UX)
     * @param amount - Amount in USDC (18 decimals for Arc native USDC)
     */
    const hireAgent = async (
        agentTokenId: number,
        _taskDescription: string,
        amount: bigint
    ) => {
        // First, we need to get the treasury ID for this agent
        // The treasury ID is typically equal to the agent token ID
        // but we use the mapping from the contract
        const treasuryId = BigInt(agentTokenId);

        // Fund the agent's treasury with USDC
        // On Arc Testnet, USDC is the native currency, so we use msg.value
        writeContract({
            address: contracts.agentTreasury.address,
            abi: contracts.agentTreasury.abi,
            functionName: 'fundTreasury',
            args: [treasuryId, amount],
            value: amount, // Native USDC on Arc
        });
    };

    return {
        hireAgent,
        isPending,
        isConfirming,
        isSuccess,
        error,
        txHash: hash,
        reset,
    };
}

/**
 * Feedback type enum matching the contract
 * POSITIVE = 0, NEGATIVE = 1, NEUTRAL = 2, REPORT = 3
 */
export enum FeedbackType {
    POSITIVE = 0,
    NEGATIVE = 1,
    NEUTRAL = 2,
    REPORT = 3,
}

/**
 * useSubmitFeedback - Hook for submitting feedback to ReputationRegistry
 *
 * Calls submitFeedback on the ReputationRegistry contract to rate an agent.
 * Score range: -100 to +100 (stored as int8)
 */
export function useSubmitFeedback() {
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    /**
     * Submit feedback for an agent
     * @param agentTokenId - The agent's NFT token ID
     * @param rating - Rating value (1-5 stars, converted to score internally)
     * @param comment - Feedback comment
     * @param transactionHash - Optional transaction hash to link feedback to a payment
     */
    const submitFeedback = async (
        agentTokenId: number,
        rating: number,
        comment: string,
        transactionHash?: string
    ) => {
        // Convert 1-5 star rating to feedback type and score
        // 1-2 stars = NEGATIVE, 3 = NEUTRAL, 4-5 = POSITIVE
        let feedbackType: FeedbackType;
        let score: number;

        if (rating <= 2) {
            feedbackType = FeedbackType.NEGATIVE;
            score = rating === 1 ? -100 : -50; // 1 star = -100, 2 stars = -50
        } else if (rating === 3) {
            feedbackType = FeedbackType.NEUTRAL;
            score = 0;
        } else {
            feedbackType = FeedbackType.POSITIVE;
            score = rating === 4 ? 50 : 100; // 4 stars = +50, 5 stars = +100
        }

        writeContract({
            address: contracts.reputationRegistry.address,
            abi: contracts.reputationRegistry.abi,
            functionName: 'submitFeedback',
            args: [
                BigInt(agentTokenId),
                feedbackType,
                score,
                comment,
                transactionHash || '',
            ],
        });
    };

    return {
        submitFeedback,
        isPending,
        isConfirming,
        isSuccess,
        error,
        txHash: hash,
        reset,
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
