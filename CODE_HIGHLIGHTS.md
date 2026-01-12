# Documents UI - Key Code Highlights

## 1. DocumentUploader Component - Drag and Drop

**File:** `/Users/aideveloper/Agent-402-frontend/src/components/DocumentUploader.tsx`

### Drag and Drop Handlers
```typescript
const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
};
```

### File Upload Logic
```typescript
const uploadFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setFiles(prev => prev.map(f =>
        f.status === 'pending' ? { ...f, status: 'uploading' } : f
    ));

    try {
        const texts = pendingFiles.map(f => f.content);
        const result = await uploadMutation.mutateAsync({
            texts,
            namespace,
            metadata,
        });
        
        // Update file statuses with vector IDs
        setFiles(prev => prev.map((file) => {
            if (file.status === 'uploading') {
                const resultIndex = pendingFiles.findIndex(pf => pf.id === file.id);
                if (resultIndex >= 0 && result.results[resultIndex]) {
                    return {
                        ...file,
                        status: 'success',
                        vectorId: result.results[resultIndex].vector_id,
                    };
                }
            }
            return file;
        }));
    } catch (error) {
        setFiles(prev => prev.map(f =>
            f.status === 'uploading'
                ? { ...f, status: 'error', error: (error as Error).message }
                : f
        ));
    }
};
```

## 2. Documents Page - Main Interface

**File:** `/Users/aideveloper/Agent-402-frontend/src/pages/Documents.tsx`

### Document Search and Filter
```typescript
const filteredDocuments = documents?.filter(doc =>
    searchQuery === '' ||
    doc.document.toLowerCase().includes(searchQuery.toLowerCase())
) || [];
```

### Metadata Management
```typescript
const handleAddMetadata = () => {
    const key = prompt('Enter metadata key:');
    if (!key) return;
    const value = prompt('Enter metadata value:');
    if (!value) return;

    setMetadata(prev => ({ ...prev, [key]: value }));
};

const handleRemoveMetadata = (key: string) => {
    setMetadata(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
    });
};
```

## 3. useDocuments Hook - API Integration

**File:** `/Users/aideveloper/Agent-402-frontend/src/hooks/useDocuments.ts`

### Upload Documents Hook
```typescript
export function useUploadDocuments() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: UploadDocumentsInput) => {
            const projectId = getProjectId();
            const request: DocumentUploadRequest = {
                texts: input.texts,
                namespace: input.namespace || 'default',
                metadata: input.metadata,
                model: input.model || 'BAAI/bge-small-en-v1.5',
                upsert: false,
            };

            const { data } = await apiClient.post<DocumentUploadResponse>(
                `/${projectId}/embeddings/embed-and-store`,
                request
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });
}
```

### Search Documents Hook
```typescript
export function useSearchDocuments(input: SearchDocumentsInput = {}) {
    const projectId = getProjectId();

    return useQuery({
        queryKey: ['documents', projectId, input.namespace],
        queryFn: async () => {
            try {
                const { data } = await apiClient.post<SearchResponse>(
                    `/${projectId}/embeddings/search`,
                    {
                        query: '',
                        namespace: input.namespace || 'default',
                        limit: input.limit || 100,
                        threshold: 0.0,
                        include_metadata: true,
                        include_embeddings: false,
                    }
                );
                return data.results || [];
            } catch (error) {
                return [];
            }
        },
        enabled: !!projectId,
    });
}
```

## 4. Type Definitions

**File:** `/Users/aideveloper/Agent-402-frontend/src/lib/types.ts`

### Document Upload Types
```typescript
export interface DocumentUploadRequest {
    texts: string[];
    model?: string;
    namespace?: string;
    metadata?: Record<string, unknown>;
    upsert?: boolean;
}

export interface VectorResult {
    vector_id: string;
    document: string;
}

export interface DocumentUploadResponse {
    vector_ids: string[];
    stored_count: number;
    model: string;
    dimensions: number;
    namespace: string;
    results: VectorResult[];
    processing_time_ms: number;
}

export interface StoredDocument {
    vector_id: string;
    document: string;
    namespace: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}
```

## 5. Routing Configuration

**File:** `/Users/aideveloper/Agent-402-frontend/src/App.tsx`

```typescript
import { Documents } from './pages/Documents';

// Inside Routes component
<Route path="documents" element={<Documents />} />
```

## 6. Navigation Configuration

**File:** `/Users/aideveloper/Agent-402-frontend/src/config/app.config.ts`

```typescript
import { FileText } from 'lucide-react';

export const navigationItems: NavigationItem[] = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/runs', label: 'Runs', icon: PlayCircle },
    { path: '/agents', label: 'Agents', icon: Bot },
    { path: '/embeddings', label: 'Embeddings', icon: Search },
    { path: '/vector-search', label: 'Vector Search', icon: Scan },
    { path: '/documents', label: 'Documents', icon: FileText },  // New
    { path: '/tables', label: 'Tables', icon: Table2 },
];
```

## Component Hierarchy

```
Documents (Page)
├── DocumentUploader (Component)
│   ├── Drag-and-drop zone
│   ├── File input
│   └── File list with status
│       ├── Pending files
│       ├── Uploading files (with spinner)
│       ├── Success files (with vector ID)
│       └── Error files (with error message)
├── Filters Panel
│   ├── Namespace input
│   └── Metadata editor
└── Documents List
    ├── Search bar
    ├── Document cards
    │   ├── Document content
    │   ├── Vector ID
    │   ├── Metadata badges
    │   └── Delete button
    └── Empty state
```

## Key Features Demonstrated

1. **React Hooks Best Practices**
   - Custom hooks for API logic
   - useState for local state
   - useRef for DOM references
   - React Query for server state

2. **TypeScript Type Safety**
   - Full type coverage
   - Interface definitions
   - Generic type parameters
   - Type guards

3. **Error Handling**
   - Try-catch blocks
   - Error state management
   - User-friendly error messages
   - Graceful fallbacks

4. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Role attributes
   - Focus management

5. **User Experience**
   - Loading states
   - Success feedback
   - Error messages
   - Empty states
   - Confirmation dialogs
