import { Link, useLocation } from 'react-router-dom';
import { ProjectSelector } from '../ProjectSelector';
import { appConfig } from '../../config/app.config';

export function Sidebar() {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const LogoIcon = appConfig.branding.logo.icon;
    const FooterIcon = appConfig.sidebarFooter.icon;

    return (
        <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
            <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: appConfig.branding.logo.bgColor }}
                    >
                        <LogoIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold">{appConfig.branding.name}</h1>
                        <p className="text-xs text-[var(--muted)]">{appConfig.branding.subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 border-b border-[var(--border)]">
                <ProjectSelector />
            </div>

            <nav className="flex-1 p-4">
                <ul className="space-y-1">
                    {appConfig.navigation.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                        active
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-6 border-t border-[var(--border)]">
                <div className="bg-[var(--surface-2)] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <FooterIcon className="w-5 h-5 text-[var(--primary)] mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold mb-1">{appConfig.sidebarFooter.title}</h3>
                            <p className="text-xs text-[var(--muted)] leading-relaxed">
                                {appConfig.sidebarFooter.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
