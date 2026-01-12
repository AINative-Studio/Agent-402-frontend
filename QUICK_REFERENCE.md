# Quick Reference - Agent CRUD Operations

## New Files Created

1. **`/src/lib/didUtils.ts`** - DID validation and generation utilities
2. **`/src/components/UpdateAgentModal.tsx`** - Agent update modal component

## Modified Files

1. **`/src/hooks/useAgents.ts`** - Updated hook signatures
2. **`/src/pages/Agents.tsx`** - Complete refactor with modals
3. **`/src/components/CreateAgentModal.tsx`** - Enhanced with DID generation

## Key Features

### Create Agent
- Modal interface with form validation
- DID generation button (purple "Generate" button)
- Role selection (predefined + custom)
- Character counters on name/description
- Scope selector (SYSTEM/PROJECT/RUN)

### Update Agent
- Edit modal with pre-filled data
- Editable: role, name, description, scope
- Read-only: DID (displayed but not editable)
- Same validation as create

### Delete Agent
- Confirmation modal with warning
- Shows agent name/role
- Prevents accidental deletion

### Toggle Status
- Power icon button on each agent card
- Green (active) / Gray (inactive)
- Cannot toggle suspended agents

## DID Format

```
Format: did:ethr:0x[40 hex characters]
Example: did:ethr:0x1234567890abcdef1234567890abcdef12345678
```

## Validation Rules

- **DID:** Required, must match did:ethr:0x... format
- **Name:** Required, max 100 characters
- **Role:** Required (select from dropdown or custom)
- **Description:** Optional, max 500 characters
- **Scope:** Required (defaults to PROJECT)

## UI Components

### Agent Card Layout
```
┌─────────────────────────────────────────────────┐
│ 🤖 Agent Name                    [Active]       │
│                                                  │
│ Role: Financial Analyst                         │
│ DID: did:ethr:0x1234...5678                     │
│ Description: Agent description here             │
│ Scope: PROJECT                                  │
│ Created: 2024-01-11 3:00 PM                     │
│                                                  │
│                      [⚡] [✏️] [🗑️]              │
└─────────────────────────────────────────────────┘

Icons:
⚡ - Toggle Status (Power/PowerOff)
✏️ - Edit Agent
🗑️ - Delete Agent
```

### Modals
- **Create Agent Modal:** Full-width form with DID generator
- **Update Agent Modal:** Similar to create, pre-filled with data
- **Delete Confirmation:** Simple warning dialog

## Toast Notifications

All operations show toast notifications:
- ✅ Success (green): "Agent created successfully"
- ❌ Error (red): "Failed to create agent"
- ℹ️ Info (blue): "DID generated successfully"
- ⚠️ Warning (yellow): Not currently used

## API Endpoints Used

- `POST /v1/public/agents` - Create agent
- `PATCH /v1/public/agents/{agentId}` - Update agent
- `DELETE /v1/public/agents/{agentId}` - Delete agent
- `GET /v1/public/agents?project_id={projectId}` - List agents

## React Query Cache Keys

```typescript
agentKeys.list(projectId) - Agent list cache
agentKeys.detail(projectId, agentId) - Agent detail cache
```

## Common Tasks

### Add a New Role Option
Edit `/src/components/CreateAgentModal.tsx`:
```typescript
const ROLE_OPTIONS = [
  { value: 'Financial Analyst', label: 'Financial Analyst' },
  { value: 'Compliance Officer', label: 'Compliance Officer' },
  { value: 'Transaction Executor', label: 'Transaction Executor' },
  { value: 'Your New Role', label: 'Your New Role' }, // Add here
  { value: 'Custom', label: 'Custom' },
];
```

### Change DID Format
Edit `/src/lib/didUtils.ts`:
```typescript
const DID_ETHR_PATTERN = /^did:ethr:0x[a-fA-F0-9]{40}$/;
```

### Customize Agent Card Display
Edit `/src/pages/Agents.tsx` around line 140-200

### Add New Validation Rule
Edit `validateForm()` function in modal components

## Troubleshooting

### "Failed to create agent"
- Check DID format (must be did:ethr:0x...)
- Verify all required fields filled
- Check network connection
- View browser console for API errors

### Agent not updating
- React Query cache may be stale
- Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
- Check API response in Network tab

### TypeScript errors
- Run `npm run build` to check compilation
- Ensure all imports are correct
- Check type definitions in `/src/lib/types.ts`

## Testing

### Manual Testing Checklist
1. Create agent with generated DID
2. Create agent with custom DID
3. Try invalid DID (should show error)
4. Update agent role
5. Update agent name
6. Update agent description
7. Change agent scope
8. Delete agent (confirm)
9. Cancel delete
10. Toggle agent status
11. Check toast notifications appear

### Test Data

Valid DIDs:
```
did:ethr:0x1234567890abcdef1234567890abcdef12345678
did:ethr:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

Invalid DIDs:
```
did:example:123 (wrong prefix)
did:ethr:123 (missing 0x)
did:ethr:0x123 (too short)
did:ethr:0xZZZZ (non-hex characters)
```

## Performance

- Modals only render when open (lazy loading)
- React Query handles caching automatically
- Query invalidation updates cache efficiently
- No unnecessary re-renders

## Accessibility

- All modals keyboard navigable (Tab, Shift+Tab)
- Escape key closes modals
- Focus trapped within modal when open
- Screen reader friendly labels
- High contrast colors

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Related Documentation

- **AGENT_CRUD_IMPLEMENTATION.md** - Detailed implementation guide
- **ISSUE_25_SUMMARY.md** - Executive summary
- **src/lib/types.ts** - TypeScript type definitions
- **.claude/skills/** - Project coding standards
