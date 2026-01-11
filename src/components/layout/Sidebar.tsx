import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlayCircle, Bot, Activity, Database } from 'lucide-react';
import { ProjectSelector } from '../ProjectSelector';

export function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Navigation per PRD Section 4
  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/runs', label: 'Runs', icon: PlayCircle },
    { path: '/agents', label: 'Agents', icon: Bot },
  ];

  return (
    <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Agent Crew</h1>
            <p className="text-xs text-[var(--muted)]">Fintech Demo</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-[var(--border)]">
        <ProjectSelector />
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
            <Database className="w-5 h-5 text-[var(--primary)] mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold mb-1">CrewAI × X402 × ZeroDB</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Cryptographically signed agent workflows with auditable persistence
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
