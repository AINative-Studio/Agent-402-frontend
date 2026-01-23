import { type Abi, type Address } from 'viem';

/**
 * Contract addresses from environment variables
 * These are the deployed contract addresses on Arc Testnet
 */
export const contractAddresses = {
    agentRegistry: (import.meta.env.VITE_AGENT_REGISTRY_ADDRESS || '0x07788a3E1B816B4e7EB08DbD930Dbf51B0bbc5C2') as Address,
    reputationRegistry: (import.meta.env.VITE_REPUTATION_REGISTRY_ADDRESS || '0xC625d3C850d85178c2D93286c6418ab381134744') as Address,
    agentTreasury: (import.meta.env.VITE_AGENT_TREASURY_ADDRESS || '0x5f8D59332D3d2af9E4596DC1F4EafD1aC53499DE') as Address,
};

/**
 * AgentRegistry ABI - ERC-721 based agent identity registry
 */
export const agentRegistryAbi = [
    {
        type: 'function',
        name: 'getAgentMetadata',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'did', type: 'string' },
                    { name: 'role', type: 'string' },
                    { name: 'publicKey', type: 'string' },
                    { name: 'registeredAt', type: 'uint256' },
                    { name: 'active', type: 'bool' },
                ],
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'totalAgents',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'isAgentActive',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getTokenIdByDID',
        inputs: [{ name: 'did', type: 'string' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'isDIDRegistered',
        inputs: [{ name: 'did', type: 'string' }],
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'ownerOf',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
] as const satisfies Abi;

/**
 * ReputationRegistry ABI - Event-based reputation system
 */
export const reputationRegistryAbi = [
    // Read functions
    {
        type: 'function',
        name: 'getAgentScore',
        inputs: [{ name: 'agentTokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'int256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getAgentFeedbackCount',
        inputs: [{ name: 'agentTokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getAgentAverageScore',
        inputs: [{ name: 'agentTokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'int256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getAgentTrustTier',
        inputs: [{ name: 'agentTokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getAgentReputationSummary',
        inputs: [{ name: 'agentTokenId', type: 'uint256' }],
        outputs: [
            { name: 'totalScore', type: 'int256' },
            { name: 'feedbackCount', type: 'uint256' },
            { name: 'averageScore', type: 'int256' },
            { name: 'trustTier', type: 'uint8' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'totalFeedbacks',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    // Write functions
    {
        type: 'function',
        name: 'submitFeedback',
        inputs: [
            { name: 'agentTokenId', type: 'uint256' },
            { name: 'feedbackType', type: 'uint8' },
            { name: 'score', type: 'int8' },
            { name: 'comment', type: 'string' },
            { name: 'transactionHash', type: 'string' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    // Events
    {
        type: 'event',
        name: 'FeedbackSubmitted',
        inputs: [
            { name: 'feedbackId', type: 'uint256', indexed: true },
            { name: 'agentTokenId', type: 'uint256', indexed: true },
            { name: 'submitter', type: 'address', indexed: true },
            { name: 'feedbackType', type: 'uint8', indexed: false },
            { name: 'score', type: 'int8', indexed: false },
        ],
    },
] as const satisfies Abi;

/**
 * AgentTreasury ABI - Circle Wallet wrapper for USDC payments
 */
export const agentTreasuryAbi = [
    // Read functions
    {
        type: 'function',
        name: 'getTreasury',
        inputs: [{ name: 'treasuryId', type: 'uint256' }],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'agentTokenId', type: 'uint256' },
                    { name: 'owner', type: 'address' },
                    { name: 'createdAt', type: 'uint256' },
                    { name: 'active', type: 'bool' },
                ],
            },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getTreasuryByAgent',
        inputs: [{ name: 'agentTokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getTreasuryBalance',
        inputs: [{ name: 'treasuryId', type: 'uint256' }],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'totalTreasuries',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'totalPayments',
        inputs: [],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
    },
    // Write functions
    {
        type: 'function',
        name: 'fundTreasury',
        inputs: [
            { name: 'treasuryId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'payable',
    },
    {
        type: 'function',
        name: 'processPayment',
        inputs: [
            { name: 'fromTreasuryId', type: 'uint256' },
            { name: 'toTreasuryId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
            { name: 'purpose', type: 'string' },
            { name: 'x402ReceiptHash', type: 'string' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'withdrawFromTreasury',
        inputs: [
            { name: 'treasuryId', type: 'uint256' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    // Events
    {
        type: 'event',
        name: 'TreasuryFunded',
        inputs: [
            { name: 'treasuryId', type: 'uint256', indexed: true },
            { name: 'funder', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
        ],
    },
    {
        type: 'event',
        name: 'PaymentProcessed',
        inputs: [
            { name: 'paymentId', type: 'uint256', indexed: true },
            { name: 'fromTreasuryId', type: 'uint256', indexed: true },
            { name: 'toTreasuryId', type: 'uint256', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false },
            { name: 'purpose', type: 'string', indexed: false },
        ],
    },
] as const satisfies Abi;

/**
 * Combined contracts configuration
 */
export const contracts = {
    agentRegistry: {
        address: contractAddresses.agentRegistry,
        abi: agentRegistryAbi,
    },
    reputationRegistry: {
        address: contractAddresses.reputationRegistry,
        abi: reputationRegistryAbi,
    },
    agentTreasury: {
        address: contractAddresses.agentTreasury,
        abi: agentTreasuryAbi,
    },
} as const;
