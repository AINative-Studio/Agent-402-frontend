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
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.arc.network'],
        },
    },
    blockExplorers: {
        default: {
            name: 'ArcScan',
            url: 'https://testnet.arcscan.app',
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
