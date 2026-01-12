# Error Handling Examples

Practical examples for using the error handling system in Agent-402.

## Basic Toast Notifications

### Success Messages

```tsx
import { useToast } from '@/contexts/ToastContext';

function SaveButton() {
  const toast = useToast();

  const handleSave = async () => {
    await apiClient.post('/items', data);
    toast.success('Item saved successfully');
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Error Messages

```tsx
function DeleteButton() {
  const toast = useToast();

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;

    try {
      await apiClient.delete(`/items/${id}`);
      toast.success('Item deleted');
    } catch {
      // Error automatically shown by API interceptor
      // You can add additional logic here if needed
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

### Warning Messages

```tsx
function FormField() {
  const toast = useToast();

  const validate = (value: string) => {
    if (value.length < 3) {
      toast.warning('Name must be at least 3 characters');
      return false;
    }
    return true;
  };

  return <input onChange={(e) => validate(e.target.value)} />;
}
```

### Info Messages

```tsx
function ProcessButton() {
  const toast = useToast();

  const handleProcess = async () => {
    toast.info('Processing your request...');
    await longRunningOperation();
    toast.success('Processing complete');
  };

  return <button onClick={handleProcess}>Process</button>;
}
```

## Toast with Actions

### Retry Failed Operation

```tsx
function DataLoader() {
  const toast = useToast();
  const [data, setData] = useState(null);

  const loadData = async () => {
    try {
      const result = await apiClient.get('/data');
      setData(result.data);
    } catch (error) {
      toast.error('Failed to load data', 7000, {
        label: 'Retry',
        onClick: () => loadData()
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return <div>{data ? <DataView data={data} /> : <Loading />}</div>;
}
```

### Undo Action

```tsx
function TodoItem({ todo, onDelete }) {
  const toast = useToast();

  const handleDelete = async () => {
    const originalTodo = { ...todo };

    // Optimistic delete
    onDelete(todo.id);

    try {
      await apiClient.delete(`/todos/${todo.id}`);
      toast.success('Todo deleted', 5000, {
        label: 'Undo',
        onClick: async () => {
          await apiClient.post('/todos', originalTodo);
          onRestore(originalTodo);
        }
      });
    } catch {
      // Restore on error (error toast shown automatically)
      onRestore(originalTodo);
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

## API Error Handling

### Automatic Error Handling (Default)

```tsx
function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users')
  });

  // Errors automatically shown as toasts
  // No manual error handling needed

  if (isLoading) return <Loading />;
  return <List items={data} />;
}
```

### Silent API Calls

```tsx
import { apiClientSilent } from '@/lib/apiClient';

function BackgroundSync() {
  const toast = useToast();

  useEffect(() => {
    const sync = async () => {
      try {
        // No automatic error toast
        await apiClientSilent({
          url: '/sync',
          method: 'POST'
        });
      } catch (error) {
        // Handle error silently or with custom message
        console.log('Background sync failed:', error);
      }
    };

    const interval = setInterval(sync, 60000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
```

### Custom Error Handling

```tsx
function LoginForm() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (credentials) => {
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', credentials);
      localStorage.setItem('apiKey', response.data.apiKey);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      // API interceptor shows generic error
      // Add specific handling if needed
      if (error.error_code === 'INVALID_CREDENTIALS') {
        // Custom logic for invalid credentials
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

## Error Boundaries

### Page-Level Error Boundary

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DashboardPage() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <h2>Unable to load dashboard</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      }
    >
      <DashboardContent />
    </ErrorBoundary>
  );
}
```

### Feature-Level Error Boundary

```tsx
function ComplexFeature() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Feature error:', error);
        // Log to error tracking service
      }}
      fallback={
        <div className="p-4 bg-red-50 rounded">
          <p>This feature is temporarily unavailable</p>
        </div>
      }
    >
      <FeatureComponent />
    </ErrorBoundary>
  );
}
```

### Multiple Error Boundaries

```tsx
function App() {
  return (
    <ErrorBoundary> {/* Global boundary */}
      <Layout>
        <Sidebar />
        <main>
          <ErrorBoundary> {/* Page boundary */}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={
                <ErrorBoundary> {/* Feature boundary */}
                  <Dashboard />
                </ErrorBoundary>
              } />
            </Routes>
          </ErrorBoundary>
        </main>
      </Layout>
    </ErrorBoundary>
  );
}
```

## Network Status

### Show Offline Banner

```tsx
import { NetworkStatus } from '@/components/NetworkStatus';

function Layout({ children }) {
  return (
    <div>
      <Header />
      <NetworkStatus /> {/* Shows banner when offline */}
      <main>{children}</main>
    </div>
  );
}
```

### Disable Actions When Offline

```tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function SaveButton() {
  const { isOnline } = useNetworkStatus();
  const toast = useToast();

  const handleSave = async () => {
    if (!isOnline) {
      toast.warning('Cannot save while offline');
      return;
    }
    await save();
  };

  return (
    <button
      onClick={handleSave}
      disabled={!isOnline}
      className={!isOnline ? 'opacity-50 cursor-not-allowed' : ''}
    >
      Save
    </button>
  );
}
```

### Queue Operations for When Online

```tsx
function OfflineQueue() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (isOnline && wasOffline && queue.length > 0) {
      // Process queued operations
      queue.forEach(operation => operation());
      setQueue([]);
      toast.success(`Synced ${queue.length} pending changes`);
    }
  }, [isOnline, wasOffline]);

  const queueOperation = (operation) => {
    if (!isOnline) {
      setQueue([...queue, operation]);
      toast.info('Change queued for sync');
    } else {
      operation();
    }
  };

  return { queueOperation };
}
```

## Form Validation

### Client-Side Validation

```tsx
function SignupForm() {
  const toast = useToast();

  const validate = (values) => {
    if (!values.email) {
      toast.warning('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      toast.warning('Please enter a valid email address');
      return false;
    }

    if (values.password.length < 8) {
      toast.warning('Password must be at least 8 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (values) => {
    if (!validate(values)) return;

    await apiClient.post('/auth/signup', values);
    toast.success('Account created successfully');
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Server Validation Errors

```tsx
function UpdateProfile() {
  const toast = useToast();

  const handleUpdate = async (values) => {
    try {
      await apiClient.put('/profile', values);
      toast.success('Profile updated');
    } catch (error) {
      // API interceptor formats validation errors automatically
      // Error message will be like:
      // "email: Invalid email format; age: Must be 18 or older"

      // Additional custom handling if needed
      if (error.validation_errors) {
        error.validation_errors.forEach(ve => {
          console.log(`Field ${ve.loc.join('.')}: ${ve.msg}`);
        });
      }
    }
  };

  return <form onSubmit={handleUpdate}>...</form>;
}
```

## File Upload

### Upload with Progress

```tsx
function FileUpload() {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) {
      toast.warning('Please select a file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.warning('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    toast.info('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('File uploaded successfully');
    } catch {
      // Error shown automatically
    } finally {
      setUploading(false);
    }
  };

  return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />;
}
```

## Optimistic Updates

### Optimistic UI Update

```tsx
function LikeButton({ postId, initialLiked }) {
  const toast = useToast();
  const [liked, setLiked] = useState(initialLiked);

  const toggleLike = async () => {
    // Optimistic update
    const previousLiked = liked;
    setLiked(!liked);

    try {
      await apiClient.post(`/posts/${postId}/like`);
    } catch {
      // Rollback on error
      setLiked(previousLiked);
      toast.error('Failed to update like');
    }
  };

  return (
    <button onClick={toggleLike}>
      {liked ? 'Unlike' : 'Like'}
    </button>
  );
}
```

## Testing Error Handling

### Trigger Test Error

```tsx
function ErrorTest() {
  const toast = useToast();

  const testErrors = {
    toast: () => toast.error('Test error message'),
    api: async () => {
      await apiClient.get('/nonexistent-endpoint');
    },
    react: () => {
      throw new Error('Test React error');
    },
    network: () => {
      // Disconnect network, then try API call
      apiClient.get('/data');
    }
  };

  return (
    <div className="p-4 space-y-2">
      <button onClick={testErrors.toast}>Test Toast</button>
      <button onClick={testErrors.api}>Test API Error</button>
      <button onClick={testErrors.react}>Test React Error</button>
      <button onClick={testErrors.network}>Test Network Error</button>
    </div>
  );
}
```

## Best Practices

### 1. Always Show Success Feedback

```tsx
// Good
const handleSave = async () => {
  await apiClient.post('/items', data);
  toast.success('Item saved successfully');
};

// Bad - no feedback
const handleSave = async () => {
  await apiClient.post('/items', data);
};
```

### 2. Use Appropriate Toast Types

```tsx
// Good - correct types for different scenarios
toast.success('Operation completed');
toast.error('Failed to save data');
toast.warning('Please review your input');
toast.info('Processing your request');

// Bad - wrong type
toast.error('Operation completed'); // Should be success
```

### 3. Provide Context in Error Messages

```tsx
// Good - specific context
toast.error('Failed to save profile: Invalid email format');

// Bad - vague message
toast.error('Error occurred');
```

### 4. Handle Errors Gracefully

```tsx
// Good - graceful degradation
try {
  const data = await apiClient.get('/optional-data');
  setEnhancedView(data);
} catch {
  // Fallback to basic view, error shown automatically
  setBasicView();
}

// Bad - crash on error
const data = await apiClient.get('/optional-data');
setEnhancedView(data); // Crashes if request fails
```

### 5. Use Error Boundaries for Isolation

```tsx
// Good - isolated error handling
<ErrorBoundary>
  <OptionalFeature />
</ErrorBoundary>

// Bad - can crash entire app
<OptionalFeature />
```

## Summary

The error handling system provides:
- Automatic error notifications for API requests
- Manual control when needed with `apiClientSilent()`
- Action buttons for retry and undo operations
- Network status monitoring
- Error boundaries for React errors
- User-friendly error messages
- Comprehensive error logging

Use these examples as templates for implementing error handling in your features.
