import { Link, useLocation } from 'react-router-dom';
import { ProjectSelector } from '../ProjectSelector';
import { appConfig } from '../../config/app.config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function Sidebar() {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const LogoIcon = appConfig.branding.logo.icon;
    const FooterIcon = appConfig.sidebarFooter.icon;

    return (
        <TooltipProvider>
            <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: appConfig.branding.logo.bgColor }}
                        >
                            <LogoIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold">{appConfig.branding.name}</h1>
                            <p className="text-xs text-muted-foreground">{appConfig.branding.subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-b border-border">
                    <ProjectSelector />
                </div>

                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {appConfig.navigation.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);
                            return (
                                <li key={item.path}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                asChild
                                                variant={active ? 'default' : 'ghost'}
                                                className={cn(
                                                    'w-full justify-start gap-3 h-11',
                                                    !active && 'text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                <Link to={item.path}>
                                                    <Icon className="w-5 h-5" />
                                                    <span className="font-medium">{item.label}</span>
                                                </Link>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-6 border-t border-border">
                    <Card className="bg-secondary/50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <FooterIcon className="w-5 h-5 text-primary mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-semibold mb-1">{appConfig.sidebarFooter.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {appConfig.sidebarFooter.description}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </aside>
        </TooltipProvider>
    );
}
