import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWallet } from '../hooks/useWallet';
import { Wallet, AlertTriangle, ChevronDown } from 'lucide-react';

/**
 * WalletConnect - Custom styled wallet connection button
 *
 * Features:
 * - Custom appearance matching AIKit/shadcn theme
 * - Network switch prompt when on wrong network
 * - USDC balance display when connected
 * - Truncated address display
 */
export function WalletConnect() {
    const { isCorrectNetwork, usdcBalance, isConnected } = useWallet();

    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
            }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                    <div
                        {...(!ready && {
                            'aria-hidden': true,
                            style: {
                                opacity: 0,
                                pointerEvents: 'none',
                                userSelect: 'none',
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        type="button"
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium transition-colors"
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Connect Wallet
                                    </button>
                                );
                            }

                            if (chain.unsupported || !isCorrectNetwork) {
                                return (
                                    <button
                                        onClick={openChainModal}
                                        type="button"
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Wrong Network
                                    </button>
                                );
                            }

                            return (
                                <div className="flex items-center gap-2">
                                    {/* Network Button */}
                                    <button
                                        onClick={openChainModal}
                                        type="button"
                                        className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-alt)] hover:bg-[var(--surface-alt-hover)] border border-[var(--border)] rounded-lg transition-colors"
                                    >
                                        {chain.hasIcon && (
                                            <div
                                                className="w-5 h-5 rounded-full overflow-hidden"
                                                style={{ background: chain.iconBackground }}
                                            >
                                                {chain.iconUrl && (
                                                    <img
                                                        alt={chain.name ?? 'Chain icon'}
                                                        src={chain.iconUrl}
                                                        className="w-5 h-5"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <span className="text-sm text-[var(--text)] hidden sm:inline">
                                            {chain.name}
                                        </span>
                                        <ChevronDown className="w-3 h-3 text-[var(--muted)]" />
                                    </button>

                                    {/* Account Button */}
                                    <button
                                        onClick={openAccountModal}
                                        type="button"
                                        className="flex items-center gap-3 px-4 py-2 bg-[var(--surface-alt)] hover:bg-[var(--surface-alt-hover)] border border-[var(--border)] rounded-lg transition-colors"
                                    >
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-medium text-[var(--text)]">
                                                {account.displayName}
                                            </span>
                                            {isConnected && (
                                                <span className="text-xs text-[var(--accent)]">
                                                    {usdcBalance}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-[var(--muted)]" />
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
}

/**
 * WalletConnectSimple - Simplified connect button using RainbowKit defaults
 * Use this for simpler implementations without custom styling
 */
export function WalletConnectSimple() {
    return (
        <ConnectButton
            accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
            }}
            chainStatus={{
                smallScreen: 'icon',
                largeScreen: 'full',
            }}
            showBalance={{
                smallScreen: false,
                largeScreen: true,
            }}
        />
    );
}
