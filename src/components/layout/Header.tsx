import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Header() {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);

    if (paths.length === 0) {
      return [{ label: 'Overview', path: '/' }];
    }

    const breadcrumbs = [{ label: 'Overview', path: '/' }];

    if (paths[0] === 'runs') {
      breadcrumbs.push({ label: 'Runs', path: '/runs' });

      if (paths[1]) {
        breadcrumbs.push({ label: paths[1], path: `/runs/${paths[1]}` });

        if (paths[2]) {
          breadcrumbs.push({
            label: paths[2].charAt(0).toUpperCase() + paths[2].slice(1),
            path: `/runs/${paths[1]}/${paths[2]}`
          });
        }
      }
    }

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
