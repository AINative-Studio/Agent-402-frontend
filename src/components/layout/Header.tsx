import { LogOut, User } from 'lucide-react';
import { WalletConnect } from '../WalletConnect';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileNav } from './MobileNav';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Header component - Top navigation bar with breadcrumbs, user info, and wallet connection
 *
 * Features:
 * - Dynamic breadcrumb navigation (extracted to Breadcrumbs component)
 * - Mobile navigation drawer (hamburger menu)
 * - User info display with logout
 * - Wallet connection button
 * - Responsive design
 */
export function Header() {
    const { user, logout } = useAuthContext();

    const handleLogout = async () => {
        await logout();
    };

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
            <div className="flex items-center gap-4">
                {/* Wallet Connect */}
                <WalletConnect />

                {/* User Info & Logout */}
                {user && (
                    <div className="flex items-center gap-3 pl-3 border-l border-border">
                        {/* User Avatar/Info */}
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-foreground truncate max-w-[120px]">
                                    {user.full_name || user.email.split('@')[0]}
                                </p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
