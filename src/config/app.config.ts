import {
    LayoutDashboard,
    PlayCircle,
    Search,
    Table2,
    Bot,
    Activity,
    Database,
    Key,
    Shield,
    CheckCircle,
    AlertCircle,
    Scan,
    FileText,
    Wrench,
    Globe,
    Sparkles,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Navigation Configuration
export interface NavigationItem {
    path: string;
    label: string;
    icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard', label: 'Agent Dashboard', icon: Wallet },
    { path: '/demos', label: 'Demo Dashboard', icon: Sparkles },
    { path: '/aikit-showcase', label: 'AIKit Showcase', icon: Sparkles },
    { path: '/runs', label: 'Runs', icon: PlayCircle },
    { path: '/agents', label: 'Agents', icon: Bot },
    { path: '/embeddings', label: 'Embeddings', icon: Search },
    { path: '/vector-search', label: 'Vector Search', icon: Scan },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/tables', label: 'Tables', icon: Table2 },
    { path: '/x402-discovery', label: 'X402 Discovery', icon: Globe },
    { path: '/signature-debugger', label: 'Signature Debugger', icon: Shield },
];

// Application Branding
export interface AppBranding {
    name: string;
    subtitle: string;
    logo: {
        icon: LucideIcon;
        bgColor: string;
    };
}

export const appBranding: AppBranding = {
    name: 'Agent Crew',
    subtitle: 'Fintech Demo',
    logo: {
        icon: Activity,
        bgColor: 'var(--primary)',
    },
};

// Sidebar Footer Content
export interface SidebarFooter {
    title: string;
    description: string;
    icon: LucideIcon;
}

export const sidebarFooter: SidebarFooter = {
    title: 'CrewAI × X402 × ZeroDB',
    description: 'Cryptographically signed agent workflows with auditable persistence',
    icon: Database,
};

// Breadcrumb Configuration
export interface BreadcrumbConfig {
    defaultLabel: string;
    routes: {
        [key: string]: {
            label: string;
            formatLabel?: (segment: string) => string;
        };
    };
}

export const breadcrumbConfig: BreadcrumbConfig = {
    defaultLabel: 'Overview',
    routes: {
        dashboard: {
            label: 'Agent Dashboard',
        },
        demos: {
            label: 'Demo Dashboard',
        },
        runs: {
            label: 'Runs',
        },
        agents: {
            label: 'Agents',
        },
        embeddings: {
            label: 'Embeddings',
        },
        'vector-search': {
            label: 'Vector Search',
        },
        documents: {
            label: 'Documents',
        },
        tables: {
            label: 'Tables',
        },
        'x402-discovery': {
            label: 'X402 Discovery',
        },
        'signature-debugger': {
            label: 'Signature Debugger',
        },
        x402: {
            label: 'X402 Requests',
        },
        memory: {
            label: 'Memory',
        },
        audit: {
            label: 'Compliance',
        },
    },
};

// KPI Cards Configuration
export interface KPICard {
    label: string;
    icon: LucideIcon;
    color: 'primary' | 'success' | 'warning' | 'danger';
    getValue: (stats: any) => string;
}

export const kpiCards: KPICard[] = [
    {
        label: 'Latest Run Status',
        icon: CheckCircle,
        color: 'success',
        getValue: (stats) => stats.latest_run?.status || 'N/A',
    },
    {
        label: 'X402 Requests',
        icon: Key,
        color: 'primary',
        getValue: (stats) => (stats.total_x402_requests || 0).toString(),
    },
    {
        label: 'Memory Entries',
        icon: Database,
        color: 'warning',
        getValue: (stats) => (stats.total_memory_entries || 0).toString(),
    },
    {
        label: 'Compliance Events',
        icon: Shield,
        color: 'success',
        getValue: (stats) => (stats.total_compliance_events || 0).toString(),
    },
];

// Timeline Steps Configuration
export interface TimelineStep {
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    dataSelector: (data: {
        memory: any[];
        compliance: any[];
        x402Requests: any[];
    }) => {
        time?: string;
        data?: any;
    };
}

export const timelineSteps: TimelineStep[] = [
    {
        title: 'Analyst Agent',
        description: 'Market evaluation and analysis',
        status: 'completed',
        dataSelector: ({ memory }) => ({
            time: memory.find((m: any) => m.agent_role === 'analyst')?.created_at,
            data: memory.find((m: any) => m.agent_role === 'analyst'),
        }),
    },
    {
        title: 'Compliance Agent',
        description: 'Risk assessment and regulatory checks',
        status: 'completed',
        dataSelector: ({ compliance }) => ({
            time: compliance[0]?.created_at,
            data: compliance[0],
        }),
    },
    {
        title: 'Transaction Agent',
        description: 'Signed request generation',
        status: 'completed',
        dataSelector: ({ x402Requests }) => ({
            time: x402Requests.find((r: any) => r.did?.includes('transaction'))?.created_at,
            data: x402Requests.find((r: any) => r.did?.includes('transaction')),
        }),
    },
    {
        title: 'Server Verification',
        description: 'Signature verification and validation',
        status: 'completed',
        dataSelector: ({ x402Requests }) => ({
            time: x402Requests[0]?.created_at,
            data: x402Requests[0],
        }),
    },
    {
        title: 'ZeroDB Persistence',
        description: 'Data persisted to immutable storage',
        status: 'completed',
        dataSelector: ({ x402Requests }) => ({
            time: x402Requests[x402Requests.length - 1]?.created_at,
            data: undefined,
        }),
    },
];

// Role to Color Mapping
export type ColorVariant = 'primary' | 'success' | 'warning' | 'danger' | 'muted';

export interface RoleColorMapping {
    [role: string]: ColorVariant;
    default: ColorVariant;
}

export const roleColorMap: RoleColorMapping = {
    analyst: 'primary',
    compliance: 'success',
    transaction: 'warning',
    default: 'muted',
};

// Status to Color Mapping
export interface StatusColorMapping {
    [status: string]: ColorVariant;
    default: ColorVariant;
}

export const statusColorMap: StatusColorMapping = {
    completed: 'success',
    failed: 'danger',
    running: 'primary',
    pending: 'warning',
    default: 'primary',
};

// Risk Level Thresholds
export interface RiskLevel {
    label: string;
    color: ColorVariant;
}

export interface RiskThresholds {
    low: {
        max: number;
        level: RiskLevel;
    };
    medium: {
        max: number;
        level: RiskLevel;
    };
    high: {
        level: RiskLevel;
    };
}

export const riskThresholds: RiskThresholds = {
    low: {
        max: 30,
        level: { label: 'LOW', color: 'success' },
    },
    medium: {
        max: 60,
        level: { label: 'MEDIUM', color: 'warning' },
    },
    high: {
        level: { label: 'HIGH', color: 'danger' },
    },
};

// Empty State Messages
export interface EmptyState {
    icon: LucideIcon;
    title: string;
    message: string;
}

export const emptyStates = {
    noProject: {
        icon: Activity,
        title: 'No Project Selected',
        message: 'Please select a project to view the overview',
    },
    noRuns: {
        icon: PlayCircle,
        title: 'No Runs Yet',
        message: 'Execute the CLI demo to generate workflow data',
    },
    noMemory: {
        icon: Database,
        title: 'No Memory Entries',
        message: 'No memory entries found',
    },
    noCompliance: {
        icon: Shield,
        title: 'No Compliance Events',
        message: 'No compliance events found for this run',
    },
    noX402: {
        icon: Key,
        title: 'No X402 Requests',
        message: 'No X402 requests found for this run',
    },
    error: {
        icon: AlertCircle,
        title: 'Error Loading Data',
        message: 'An error occurred while loading data',
    },
} as const;

// Overview Page Content
export interface OverviewHero {
    title: string;
    subtitle: string;
    description: string;
}

export const overviewHero: OverviewHero = {
    title: 'Auditable Fintech Agent Workflow',
    subtitle: 'CrewAI × X402 × ZeroDB',
    description: 'This demo showcases a multi-agent workflow with cryptographically signed requests, persistent memory, and compliance tracking. All actions are auditable and deterministically replayable.',
};

export interface SystemFeature {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor: ColorVariant;
}

export const systemFeatures: SystemFeature[] = [
    {
        title: 'X402 Signing',
        description: 'All agent requests are cryptographically signed and verified using decentralized identifiers',
        icon: Key,
        iconColor: 'primary',
    },
    {
        title: 'Persistent Memory',
        description: 'Agent memory is preserved across runs for improved decision-making and auditability',
        icon: Database,
        iconColor: 'warning',
    },
    {
        title: 'Compliance Tracking',
        description: 'Every action is logged with risk assessment and compliance verification',
        icon: Shield,
        iconColor: 'success',
    },
];

// Run Detail Tabs Configuration
export interface RunDetailTab {
    path: string;
    label: string;
    icon: LucideIcon;
}

export const runDetailTabs: RunDetailTab[] = [
    { path: '', label: 'Timeline', icon: Activity },
    { path: '/tools', label: 'Tool Calls', icon: Wrench },
    { path: '/x402', label: 'X402 Requests', icon: Key },
    { path: '/memory', label: 'Memory', icon: Database },
    { path: '/audit', label: 'Compliance', icon: Shield },
];

// Compliance Audit Information
export interface ComplianceInfo {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor: ColorVariant;
}

export const complianceInfo: ComplianceInfo = {
    title: 'About Compliance Tracking',
    description: 'All agent actions are evaluated for regulatory compliance. Risk scores below 30 are considered low risk, 30-60 medium risk, and above 60 high risk. Each event includes reason codes indicating which compliance checks were performed.',
    icon: AlertCircle,
    iconColor: 'warning',
};

// Helper Functions
export const getRoleColor = (role: string): ColorVariant => {
    return roleColorMap[role.toLowerCase()] || roleColorMap.default;
};

export const getStatusColor = (status: string): ColorVariant => {
    return statusColorMap[status.toLowerCase()] || statusColorMap.default;
};

export const getRiskLevel = (score: number): RiskLevel => {
    if (score < riskThresholds.low.max) {
        return riskThresholds.low.level;
    }
    if (score < riskThresholds.medium.max) {
        return riskThresholds.medium.level;
    }
    return riskThresholds.high.level;
};

export const formatBreadcrumbLabel = (segment: string): string => {
    return segment.charAt(0).toUpperCase() + segment.slice(1);
};

// Export all configuration as a single object for easy import
export const appConfig = {
    navigation: navigationItems,
    branding: appBranding,
    sidebarFooter,
    breadcrumbs: breadcrumbConfig,
    kpiCards,
    timelineSteps,
    roleColorMap,
    statusColorMap,
    riskThresholds,
    emptyStates,
    overviewHero,
    systemFeatures,
    runDetailTabs,
    complianceInfo,
    helpers: {
        getRoleColor,
        getStatusColor,
        getRiskLevel,
        formatBreadcrumbLabel,
    },
};

export default appConfig;
