import { type ReactNode } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../lib/wagmiConfig';
import '@rainbow-me/rainbowkit/styles.css';

/**
 * Query client for TanStack Query
 * Used by Wagmi for data fetching and caching
 */
const walletQueryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

interface WalletProviderProps {
    children: ReactNode;
}

/**
 * WalletProvider - Wraps the application with wallet connection providers
 *
 * Provides:
 * - Wagmi for wallet interactions and contract calls
 * - RainbowKit for wallet connection UI
 * - TanStack Query for data management
 */
export function WalletProvider({ children }: WalletProviderProps) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={walletQueryClient}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#22c55e',
                        accentColorForeground: 'white',
                        borderRadius: 'medium',
                        fontStack: 'system',
                        overlayBlur: 'small',
                    })}
                    modalSize="compact"
                    coolMode
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
