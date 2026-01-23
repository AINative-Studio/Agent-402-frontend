import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { injectedWallet, coinbaseWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
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
 * Configure wallet connectors
 * Using injected (MetaMask browser extension) and Coinbase
 * Avoiding MetaMask SDK which has bundling issues
 */
const connectors = connectorsForWallets(
    [
        {
            groupName: 'Popular',
            wallets: [injectedWallet, coinbaseWallet],
        },
    ],
    {
        appName: 'Agent-402',
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
    }
);

/**
 * Wagmi configuration
 * Uses injected wallet (MetaMask extension) directly
 */
export const wagmiConfig = createConfig({
    connectors,
    chains: [arcTestnet],
    transports: {
        [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
    },
    ssr: false,
});
