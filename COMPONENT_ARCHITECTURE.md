# Row CRUD Component Architecture

## Component Hierarchy

```
App
└── ToastProvider (NEW)
    └── AuthProvider
        └── BrowserRouter
            └── Routes
                └── TableDetail (MODIFIED)
                    ├── RowEditor (NEW)
                    │   └── Modal with form fields
                    ├── ConfirmModal (NEW)
                    │   └── Confirmation dialog
                    └── Toast notifications (via context)
```

## Data Flow

### Create Row Flow
```
User clicks "Create Row"
    ↓
TableDetail sets showEditor = true
    ↓
RowEditor modal opens with empty form
    ↓
User fills form fields
    ↓
RowEditor validates against schema
    ↓
User clicks "Create Row"
    ↓
handleCreateRow() called
    ↓
useInsertRows mutation executes
    ↓
Optimistic: Cancel pending queries
    ↓
API call to backend
    ↓
On Success:
  - Close modal
  - Show success toast
  - Invalidate rows query
  - Refetch data
    ↓
On Error:
  - Show error toast
  - Keep modal open
  - Rollback cache
```

### Update Row Flow
```
User clicks Edit icon on row
    ↓
TableDetail calls handleEdit(rowId, data)
    ↓
Sets editingRow state
    ↓
RowEditor modal opens with pre-filled form
    ↓
User modifies fields
    ↓
RowEditor validates changes
    ↓
User clicks "Save Changes"
    ↓
handleUpdateRow() called
    ↓
useUpdateRow mutation executes
    ↓
Optimistic:
  - Cancel pending queries
  - Snapshot previous row
  - Update cache immediately
    ↓
API call to backend
    ↓
On Success:
  - Close modal
  - Show success toast
  - Update cache with server response
  - Refetch data
    ↓
On Error:
  - Show error toast
  - Rollback to snapshot
  - Keep modal open
```

### Delete Row Flow
```
User clicks Delete icon on row
    ↓
TableDetail sets rowToDelete = rowId
    ↓
ConfirmModal opens
    ↓
User clicks "Delete" (or "Cancel")
    ↓
If confirmed:
  handleDeleteConfirm() called
    ↓
  useDeleteRow mutation executes
    ↓
  Optimistic:
    - Cancel pending queries
    - Snapshot previous rows
    - Remove row from cache
    ↓
  API call to backend
    ↓
  On Success:
    - Close modal
    - Show success toast
    - Invalidate queries
    - Refetch data
    ↓
  On Error:
    - Show error toast
    - Rollback to snapshot
    - Close modal
```

## State Management

### TableDetail Component State
```typescript
// Pagination
const [currentPage, setCurrentPage] = useState(0);
const [pageSize, setPageSize] = useState(25);

// Search
const [searchTerm, setSearchTerm] = useState('');
const [searchField, setSearchField] = useState('');

// Row CRUD UI State (NEW)
const [showEditor, setShowEditor] = useState(false);
const [editingRow, setEditingRow] = useState<RowToEdit | null>(null);
const [rowToDelete, setRowToDelete] = useState<string | null>(null);
```

### RowEditor Component State
```typescript
// Form data
const [formData, setFormData] = useState<Record<string, FieldValue>>(initialData);

// Validation
const [errors, setErrors] = useState<FieldError[]>([]);
const [touched, setTouched] = useState<Set<string>>(new Set());
```

### Toast Context State
```typescript
const [toasts, setToasts] = useState<ToastMessage[]>([]);
```

## Query Cache Management

### Cache Keys
```typescript
tableKeys = {
  all: ['tables'],
  lists: (projectId) => ['tables', 'list', projectId],
  detail: (projectId, tableId) => ['tables', 'detail', projectId, tableId],
  rows: (projectId, tableId) => ['tables', 'rows', projectId, tableId],
  row: (projectId, tableId, rowId) => ['tables', 'row', projectId, tableId, rowId],
}
```

### Optimistic Update Strategy

#### Insert
1. Cancel outgoing queries for rows
2. API call
3. On success: Invalidate rows & table detail
4. On error: Invalidate rows (refetch)

#### Update
1. Cancel outgoing queries for rows & specific row
2. Snapshot current row data
3. Update cache optimistically
4. API call
5. On success: Invalidate rows, update row cache
6. On error: Rollback to snapshot

#### Delete
1. Cancel outgoing queries for rows
2. Snapshot current rows
3. Remove row from cache optimistically
4. API call
5. On success: Invalidate rows & table detail
6. On error: Rollback to snapshot

## Validation Architecture

### Schema-Based Validation
```typescript
validateField(fieldName, value, fieldDef) {
  // 1. Check required
  if (fieldDef.required && isEmpty(value)) {
    return error;
  }
  
  // 2. Type validation
  switch (fieldDef.type) {
    case 'string': validate string
    case 'integer': validate integer
    case 'float': validate float
    case 'boolean': validate boolean
    case 'json': validate JSON syntax
    case 'timestamp': validate date format
  }
  
  return null;
}
```

### Field Rendering Strategy
```typescript
renderFieldInput(fieldName, fieldDef) {
  switch (fieldDef.type) {
    case 'boolean': 
      return <Checkbox />
    case 'integer':
    case 'float':
      return <input type="number" />
    case 'json':
      return <textarea className="font-mono" />
    case 'timestamp':
      return <input type="datetime-local" />
    case 'string':
    default:
      return <input type="text" />
  }
}
```

## Error Handling

### Error Flow
```
API Error
    ↓
Mutation onError handler
    ↓
Extract error message:
  - error.response?.data?.detail
  - fallback to generic message
    ↓
toast.error(message)
    ↓
Toast component displays
    ↓
Auto-dismiss after 5 seconds
    ↓
User can manually close
```

### Rollback Strategy
- **Insert**: Invalidate queries (refetch fresh data)
- **Update**: Restore from snapshot, then invalidate
- **Delete**: Restore from snapshot

## Accessibility Features

### Keyboard Navigation
- Tab through form fields
- Enter to submit forms
- Escape to close modals
- Space/Enter for checkboxes

### Screen Reader Support
- ARIA labels on all inputs
- ARIA-describedby for error messages
- Role="alert" for toast notifications
- Semantic HTML structure

### Focus Management
- Auto-focus on modal open
- Focus trap in modals
- Return focus on modal close
- Clear focus indicators

## Performance Optimizations

1. **Optimistic Updates**: Instant UI feedback
2. **Query Cancellation**: Prevent race conditions
3. **Selective Cache Updates**: Only update what changed
4. **Memoization**: useMemo for filtered rows
5. **Lazy Rendering**: Modal only renders when open

## Type Safety

All components and hooks are fully typed with TypeScript:
- Component props interfaces
- Mutation function signatures
- Query cache types
- Event handler types
- Form data types
