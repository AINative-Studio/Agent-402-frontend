# Application Configuration

This directory contains centralized configuration for the Agent-402 frontend application.

## Quick Start

Import the configuration in your component:

```typescript
import { appConfig } from './config/app.config';
```

## Available Configuration

### Navigation
```typescript
appConfig.navigation // Array of navigation items with path, label, and icon
```

### Branding
```typescript
appConfig.branding.name // Application name
appConfig.branding.subtitle // Application subtitle
appConfig.branding.logo.icon // Logo icon component
appConfig.branding.logo.bgColor // Logo background color
```

### Empty States
```typescript
appConfig.emptyStates.noProject // No project selected state
appConfig.emptyStates.noRuns // No runs state
appConfig.emptyStates.noMemory // No memory entries state
appConfig.emptyStates.noCompliance // No compliance events state
appConfig.emptyStates.noX402 // No X402 requests state
appConfig.emptyStates.error // Error state
```

### Helper Functions
```typescript
appConfig.helpers.getRoleColor(role) // Get color for agent role
appConfig.helpers.getStatusColor(status) // Get color for run status
appConfig.helpers.getRiskLevel(score) // Get risk level from score
appConfig.helpers.formatBreadcrumbLabel(segment) // Format breadcrumb text
```

## Usage Examples

### Using Empty States
```typescript
const NoRunsIcon = appConfig.emptyStates.noRuns.icon;

return (
    <div>
        <NoRunsIcon className="w-12 h-12" />
        <p>{appConfig.emptyStates.noRuns.message}</p>
    </div>
);
```

### Using Helper Functions
```typescript
const roleColor = appConfig.helpers.getRoleColor('analyst'); // Returns 'primary'
const statusColor = appConfig.helpers.getStatusColor('completed'); // Returns 'success'
const riskLevel = appConfig.helpers.getRiskLevel(45); // Returns { label: 'MEDIUM', color: 'warning' }
```

### Using KPI Cards
```typescript
appConfig.kpiCards.map((card) => {
    const Icon = card.icon;
    const value = card.getValue(stats);
    return (
        <div key={card.label}>
            <Icon className={`text-[var(--${card.color})]`} />
            <div>{value}</div>
            <div>{card.label}</div>
        </div>
    );
});
```

### Using Navigation
```typescript
appConfig.navigation.map((item) => {
    const Icon = item.icon;
    return (
        <Link to={item.path}>
            <Icon />
            <span>{item.label}</span>
        </Link>
    );
});
```

## Color Variants

Available color variants used throughout the application:
- `primary` - Main theme color
- `success` - Success/positive states
- `warning` - Warning/caution states
- `danger` - Error/negative states
- `muted` - Subdued/secondary content

## Configuration Files

- `app.config.ts` - Main application configuration (this is the only config file currently)

## Best Practices

1. Always use configuration values instead of hardcoding
2. Use helper functions for color and formatting logic
3. Keep configuration DRY (Don't Repeat Yourself)
4. Add TypeScript interfaces for new configuration sections
5. Update this README when adding new configuration sections

## Type Safety

All configuration values are fully typed. TypeScript will provide IntelliSense and compile-time validation when using configuration values.

Example interfaces:
- `NavigationItem` - Navigation menu items
- `EmptyState` - Empty state definitions
- `KPICard` - KPI card definitions
- `ColorVariant` - Color variant type
- `RiskLevel` - Risk level definition
- And many more...

## Extending Configuration

To add new configuration:

1. Define TypeScript interface
2. Create configuration value
3. Add to `appConfig` export
4. Update this README
5. Use in components

Example:
```typescript
// 1. Define interface
export interface CustomConfig {
    setting: string;
}

// 2. Create configuration
export const customConfig: CustomConfig = {
    setting: 'value',
};

// 3. Add to appConfig
export const appConfig = {
    // ... existing config
    customConfig,
};
```

## Environment-Specific Configuration

For environment-specific values, use environment variables via `import.meta.env`:

```typescript
export const apiConfig = {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};
```

See `/src/lib/config.ts` for existing environment configuration.
