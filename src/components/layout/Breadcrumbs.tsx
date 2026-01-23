import { useLocation, Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { appConfig } from '../../config/app.config';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItem {
    label: string;
    path: string;
}

/**
 * Breadcrumbs component - Dynamic breadcrumb navigation based on current route
 *
 * Features:
 * - Automatic path parsing and label resolution
 * - Configurable through app.config breadcrumb settings
 * - Home icon for root path
 * - Proper ARIA labels for accessibility
 * - Responsive design
 */
export function Breadcrumbs() {
    const location = useLocation();

    const getBreadcrumbs = (): BreadcrumbItem[] => {
        const paths = location.pathname.split('/').filter(Boolean);

        // Always start with home/overview
        const breadcrumbs: BreadcrumbItem[] = [
            { label: appConfig.breadcrumbs.defaultLabel, path: '/' }
        ];

        if (paths.length === 0) {
            return breadcrumbs;
        }

        let currentPath = '';
        paths.forEach((segment) => {
            currentPath += `/${segment}`;

            // Check if this segment is a route configuration
            const routeConfig = appConfig.breadcrumbs.routes[segment];

            // Try to get label from config, otherwise format the segment
            let label: string;
            if (routeConfig) {
                label = routeConfig.label;
            } else {
                // Check if it looks like an ID (UUID or similar)
                const isId = /^[a-f0-9-]{8,}$/i.test(segment);
                if (isId) {
                    // Truncate long IDs
                    label = segment.length > 12
                        ? `${segment.slice(0, 8)}...`
                        : segment;
                } else {
                    label = appConfig.helpers.formatBreadcrumbLabel(segment);
                }
            }

            breadcrumbs.push({
                label,
                path: currentPath,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    const isFirst = index === 0;

                    return (
                        <BreadcrumbItem key={crumb.path}>
                            {index > 0 && <BreadcrumbSeparator />}

                            {isLast ? (
                                <BreadcrumbPage>
                                    {isFirst ? (
                                        <span className="flex items-center gap-1.5">
                                            <Home className="h-3.5 w-3.5" />
                                            {crumb.label}
                                        </span>
                                    ) : (
                                        crumb.label
                                    )}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link to={crumb.path}>
                                        {isFirst ? (
                                            <span className="flex items-center gap-1.5">
                                                <Home className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">{crumb.label}</span>
                                            </span>
                                        ) : (
                                            crumb.label
                                        )}
                                    </Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
