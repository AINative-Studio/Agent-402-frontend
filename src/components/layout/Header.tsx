import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { appConfig } from '../../config/app.config';

export function Header() {
    const location = useLocation();

    const getBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(Boolean);

        if (paths.length === 0) {
            return [{ label: appConfig.breadcrumbs.defaultLabel, path: '/' }];
        }

        const breadcrumbs = [{ label: appConfig.breadcrumbs.defaultLabel, path: '/' }];

        let currentPath = '';
        paths.forEach((segment, index) => {
            currentPath += `/${segment}`;

            const routeConfig = appConfig.breadcrumbs.routes[segment];
            const label = routeConfig
                ? routeConfig.label
                : appConfig.helpers.formatBreadcrumbLabel(segment);

            breadcrumbs.push({
                label,
                path: currentPath,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-8 flex items-center">
            <nav className="flex items-center gap-2">
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight className="w-4 h-4 text-[var(--subtle)]" />}
                        <Link
                            to={crumb.path}
                            className={`text-sm ${
                                index === breadcrumbs.length - 1
                                    ? 'text-[var(--text)] font-medium'
                                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                            }`}
                        >
                            {crumb.label}
                        </Link>
                    </div>
                ))}
            </nav>
        </header>
    );
}
