import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

/**
 * Arc Testnet chain configuration
 * Chain ID: 5042002
 */
export const arcTestnet = defineChain({
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: {
        name: 'ARC',
        symbol: 'ARC',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.arcprotocol.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Arc Explorer',
            url: 'https://explorer.testnet.arcprotocol.io',
        },
    },
    testnet: true,
});

/**
 * Wagmi configuration with RainbowKit defaults
 * Supports MetaMask, WalletConnect, and other popular wallets
 */
export const wagmiConfig = getDefaultConfig({
    appName: 'Agent-402',
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    chains: [arcTestnet],
    ssr: false,
});
