import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Activity } from 'lucide-react';
import { appConfig } from '../../config/app.config';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/**
 * MobileNav component - Responsive navigation drawer for mobile devices
 *
 * Features:
 * - Sheet-based slide-out navigation
 * - Full navigation menu accessible on mobile
 * - Automatic closing on navigation
 * - Consistent branding with desktop sidebar
 * - Accessibility-compliant with proper ARIA labels
 */
export function MobileNav() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const handleNavClick = () => {
        setOpen(false);
    };

    const LogoIcon = appConfig.branding.logo.icon;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-6 border-b border-border">
                    <SheetTitle className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: appConfig.branding.logo.bgColor }}
                        >
                            <LogoIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="text-lg font-semibold">{appConfig.branding.name}</div>
                            <div className="text-xs text-muted-foreground">{appConfig.branding.subtitle}</div>
                        </div>
                    </SheetTitle>
                </SheetHeader>

                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                        {appConfig.navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={handleNavClick}
                                        className={cn(
                                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                            active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer Info */}
                <div className="p-4 border-t border-border mt-auto">
                    <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
                        <Activity className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold mb-1">{appConfig.sidebarFooter.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {appConfig.sidebarFooter.description}
                            </p>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
