interface AgentScopeBadgeProps {
  scope: 'SYSTEM' | 'PROJECT' | 'RUN';
}

const scopeConfig: Record<'SYSTEM' | 'PROJECT' | 'RUN', { color: string; bgColor: string; label: string }> = {
  SYSTEM: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    label: 'System',
  },
  PROJECT: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    label: 'Project',
  },
  RUN: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    label: 'Run',
  },
};

export function AgentScopeBadge({ scope }: AgentScopeBadgeProps) {
  const config = scopeConfig[scope];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  );
}
