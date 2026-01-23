import { BarChart3, Shield, Zap, Circle, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AgentRoleBadgeProps {
    role: string;
}

const roleConfig: Record<string, { variant: 'analyst' | 'compliance' | 'executor' | 'secondary'; icon: LucideIcon }> = {
    'Financial Analyst': {
        variant: 'analyst',
        icon: BarChart3,
    },
    'Compliance Officer': {
        variant: 'compliance',
        icon: Shield,
    },
    'Transaction Executor': {
        variant: 'executor',
        icon: Zap,
    },
};

export function AgentRoleBadge({ role }: AgentRoleBadgeProps) {
    const config = roleConfig[role] || {
        variant: 'secondary' as const,
        icon: Circle,
    };

    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className={cn('gap-1.5')}>
            <Icon className="h-3.5 w-3.5" />
            {role}
        </Badge>
    );
}
