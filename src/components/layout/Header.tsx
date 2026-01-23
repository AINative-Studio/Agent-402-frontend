import { WalletConnect } from '../WalletConnect';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileNav } from './MobileNav';

/**
 * Header component - Top navigation bar with breadcrumbs and wallet connection
 *
 * Features:
 * - Dynamic breadcrumb navigation (extracted to Breadcrumbs component)
 * - Mobile navigation drawer (hamburger menu)
 * - Wallet connection button
 * - Responsive design
 */
export function Header() {
    return (
        <header className="h-16 bg-card border-b border-border px-4 md:px-8 flex items-center justify-between gap-4">
            {/* Mobile Nav + Breadcrumbs */}
            <div className="flex items-center gap-4">
                <MobileNav />
                <nav className="hidden md:block">
                    <Breadcrumbs />
                </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
                <WalletConnect />
            </div>
        </header>
    );
}
