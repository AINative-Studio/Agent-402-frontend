# Workflow Visualization - Quick Start Guide

## Usage

### Basic Integration

```tsx
import { WorkflowVisualization } from '../components/WorkflowVisualization';

function MyRunPage() {
    const { memory, compliance, x402Requests } = useRunData(runId);

    return (
        <WorkflowVisualization
            runId={runId}
            projectId={projectId}
            memory={memory}
            compliance={compliance}
            x402Requests={x402Requests}
            autoStart={true}
        />
    );
}
```

### Custom Hook Usage

```tsx
import { useWorkflowStream } from '../hooks/useWorkflowStream';

function CustomWorkflow() {
    const { workflowState, error, startStreaming, stopStreaming } = useWorkflowStream({
        runId,
        projectId,
        memory,
        compliance,
        x402Requests,
        pollingInterval: 3000 // Custom interval
    });

    useEffect(() => {
        startStreaming();
        return () => stopStreaming();
    }, []);

    return (
        <div>
            <h2>Status: {workflowState?.status}</h2>
            <p>Current Agent: {workflowState?.currentAgent}</p>
        </div>
    );
}
```

## Props Reference

### WorkflowVisualization

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `runId` | `string` | Yes | - | Unique run identifier |
| `projectId` | `string` | Yes | - | Project identifier |
| `memory` | `AgentMemory[]` | Yes | - | Agent memory entries |
| `compliance` | `ComplianceEvent[]` | Yes | - | Compliance events |
| `x402Requests` | `X402Request[]` | Yes | - | X402 signed requests |
| `autoStart` | `boolean` | No | `true` | Auto-start streaming |

## Workflow State Structure

```typescript
interface WorkflowState {
    runId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    currentAgent?: 'analyst' | 'compliance' | 'transaction';
    agents: {
        analyst: WorkflowAgentState;
        compliance: WorkflowAgentState;
        transaction: WorkflowAgentState;
    };
    dataFlows: WorkflowDataFlow[];
    startedAt?: string;
    completedAt?: string;
    elapsedTime?: number; // seconds
}
```

## Agent State Structure

```typescript
interface WorkflowAgentState {
    agentType: 'analyst' | 'compliance' | 'transaction';
    name: string; // e.g., "Financial Analyst"
    did: string; // e.g., "did:ethr:0xanalyst001"
    status: 'pending' | 'active' | 'completed' | 'error';
    startedAt?: string;
    completedAt?: string;
    progress: number; // 0-100
    currentTask?: string;
    output?: Record<string, unknown>;
    error?: string;
}
```

## Customization

### Custom Polling Interval

```tsx
<WorkflowVisualization
    {...props}
    pollingInterval={5000} // 5 seconds
/>
```

### Custom Styling

The component uses CSS custom properties:

```css
/* Override in your CSS */
:root {
    --primary: #3b82f6;
    --success: #10b981;
    --surface: #ffffff;
    --border: #e5e7eb;
    --muted: #6b7280;
}
```

### Manual Control

```tsx
const { startStreaming, stopStreaming } = useWorkflowStream({...});

// Start manually
<button onClick={startStreaming}>Start</button>

// Stop manually
<button onClick={stopStreaming}>Stop</button>
```

## Data Requirements

### Minimum Data for Each Agent

#### Analyst
```typescript
// Option 1: Memory entry
{
    agent_role: "analyst",
    content: "Analysis complete",
    created_at: "2026-01-11T10:00:00Z"
}
```

#### Compliance
```typescript
// Option 1: Compliance event (preferred)
{
    event_type: "risk_assessment",
    risk_score: 25,
    passed: true,
    created_at: "2026-01-11T10:01:00Z"
}

// Option 2: Memory entry
{
    agent_role: "compliance",
    content: "Compliance check passed",
    created_at: "2026-01-11T10:01:00Z"
}
```

#### Transaction
```typescript
// Option 1: X402 request (preferred)
{
    request_id: "req_001",
    status: "COMPLETED",
    signature: "0x...",
    created_at: "2026-01-11T10:02:00Z"
}

// Option 2: Memory entry
{
    agent_role: "transaction",
    content: "Transaction executed",
    created_at: "2026-01-11T10:02:00Z"
}
```

## Common Patterns

### Loading State

```tsx
{loading ? (
    <div>Loading workflow...</div>
) : (
    <WorkflowVisualization {...props} />
)}
```

### Error Handling

```tsx
const { error } = useWorkflowStream({...});

{error && (
    <div className="error">
        Workflow error: {error}
    </div>
)}
```

### Conditional Rendering

```tsx
{workflowState?.status === 'completed' && (
    <SuccessMessage duration={workflowState.elapsedTime} />
)}
```

## Performance Tips

1. **Debounce Updates**: The hook already implements change detection
2. **Cleanup**: Always return cleanup function in useEffect
3. **Memoization**: Data is memoized internally, no need to wrap
4. **Polling Interval**: Balance between real-time feel and performance
   - Fast (1s): More responsive, higher CPU usage
   - Medium (2s): Good balance (default)
   - Slow (5s): Less responsive, lower CPU usage

## Troubleshooting

### Workflow Not Updating

**Issue**: Component shows loading state indefinitely

**Solutions**:
1. Verify `runId` and `projectId` are defined
2. Check that data arrays have content
3. Ensure `autoStart={true}` or call `startStreaming()`
4. Check browser console for errors

### Agent Not Detected

**Issue**: Agent shows as "pending" despite having data

**Solutions**:
1. Verify agent role names match expected values:
   - "analyst" (case-insensitive)
   - "compliance"
   - "transaction"
2. Check memory entries have `agent_role` field
3. For compliance, ensure compliance events exist OR memory with role

### Progress Stuck at 0%

**Issue**: Agent is active but progress is 0%

**Solution**: This is expected behavior - progress is binary:
- 0% = pending/active
- 100% = completed

For granular progress, implement custom progress tracking in agent metadata.

## Examples

### Complete Example with Error Handling

```tsx
import { WorkflowVisualization } from '../components/WorkflowVisualization';
import { useRunData } from '../hooks/useRunData';

export function RunDetailWithWorkflow({ runId, projectId }) {
    const { memory, compliance, x402Requests, loading, error } = useRunData(runId);

    if (loading) {
        return <Skeleton />;
    }

    if (error) {
        return <ErrorMessage error={error} />;
    }

    return (
        <div>
            <h1>Run {runId}</h1>

            <WorkflowVisualization
                runId={runId}
                projectId={projectId}
                memory={memory}
                compliance={compliance}
                x402Requests={x402Requests}
                autoStart={true}
            />

            {/* Other content */}
        </div>
    );
}
```

### Testing Example

```typescript
// Playwright test
import { test, expect } from '@playwright/test';

test('workflow visualization displays correctly', async ({ page }) => {
    await page.goto('/runs/run_001');

    // Wait for component to load
    await page.waitForSelector('[data-testid="workflow-visualization"]');

    // Verify agents are visible
    await expect(page.locator('text=Financial Analyst')).toBeVisible();
    await expect(page.locator('text=Compliance Officer')).toBeVisible();
    await expect(page.locator('text=Transaction Executor')).toBeVisible();

    // Verify status
    const status = page.locator('[data-testid="workflow-status"]');
    await expect(status).toHaveText(/COMPLETED|RUNNING/);

    // Verify progress bars
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars).toHaveCount(3);
});
```

## Migration from Timeline

If you're upgrading from the basic timeline view:

### Before
```tsx
<ExecutionTimeline steps={timelineSteps} />
```

### After
```tsx
{/* New workflow visualization */}
<WorkflowVisualization
    runId={runId}
    projectId={projectId}
    memory={memory}
    compliance={compliance}
    x402Requests={x402Requests}
/>

{/* Keep existing timeline for detail view */}
<ExecutionTimeline steps={timelineSteps} />
```

Both can coexist - workflow visualization provides high-level overview, timeline provides detailed steps.

## API Reference

See full type definitions in `/src/lib/types.ts`:
- `WorkflowState`
- `WorkflowAgentState`
- `WorkflowDataFlow`
- `WorkflowEvent`

## Support

For issues or questions:
1. Check implementation summary: `ISSUE_29_WORKFLOW_VISUALIZATION_SUMMARY.md`
2. Review source code: `src/components/WorkflowVisualization.tsx`
3. Debug hook state: `src/hooks/useWorkflowStream.ts`
