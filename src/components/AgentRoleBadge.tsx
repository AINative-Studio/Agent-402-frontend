import { BarChart3, Shield, Zap, Circle } from 'lucide-react';

interface AgentRoleBadgeProps {
  role: string;
}

const roleConfig: Record<string, { color: string; bgColor: string; icon: typeof BarChart3 }> = {
  'Financial Analyst': {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    icon: BarChart3,
  },
  'Compliance Officer': {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    icon: Shield,
  },
  'Transaction Executor': {
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    icon: Zap,
  },
};

export function AgentRoleBadge({ role }: AgentRoleBadgeProps) {
  const config = roleConfig[role] || {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/30',
    icon: Circle,
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${config.bgColor} ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {role}
    </span>
  );
}
