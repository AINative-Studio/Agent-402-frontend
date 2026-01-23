import { Badge } from '@/components/ui/badge';

interface AgentScopeBadgeProps {
    scope: 'SYSTEM' | 'PROJECT' | 'RUN';
}

const scopeConfig: Record<'SYSTEM' | 'PROJECT' | 'RUN', { variant: 'system' | 'project' | 'run'; label: string }> = {
    SYSTEM: {
        variant: 'system',
        label: 'System',
    },
    PROJECT: {
        variant: 'project',
        label: 'Project',
    },
    RUN: {
        variant: 'run',
        label: 'Run',
    },
};

export function AgentScopeBadge({ scope }: AgentScopeBadgeProps) {
    const config = scopeConfig[scope];

    return (
        <Badge variant={config.variant} className="rounded-md">
            {config.label}
        </Badge>
    );
}
