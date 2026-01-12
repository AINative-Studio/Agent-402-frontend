# Error Handling & Toast Notifications

Comprehensive error handling system with automatic toast notifications, retry mechanism, and network status detection.

## Overview

The Agent-402 frontend implements a multi-layered error handling strategy:

1. **Global Error Boundary** - Catches React component errors
2. **API Error Interceptor** - Handles API request/response errors
3. **Toast Notification System** - User-friendly error messages
4. **Automatic Retry Mechanism** - Retries failed requests
5. **Network Status Detection** - Monitors online/offline state

## Components

### ErrorBoundary

Global error boundary that catches React component errors and displays a user-friendly fallback UI.

**Location:** `/src/components/ErrorBoundary.tsx`

**Features:**
- Catches unhandled React errors
- Displays user-friendly error UI
- Shows error details in development mode
- Provides "Try Again", "Reload Page", and "Go Home" actions
- Supports custom error handlers via `onError` prop

**Usage:**
```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Optional: Send to error tracking service
    logError(error, errorInfo);
  }}
>
  <App />
</ErrorBoundary>
```

### Toast Notification System

Enhanced toast system with queue management and action buttons.

**Location:** `/src/contexts/ToastContext.tsx`

**Features:**
- Four toast types: success, error, warning, info
- Queue management (max 5 toasts)
- Custom durations per type
- Optional action buttons
- Auto-dismiss with configurable timing
- Accessible with ARIA attributes

**Usage:**
```tsx
const toast = useToast();

// Simple notifications
toast.success('Operation completed successfully');
toast.error('Failed to save data');
toast.warning('Please review your input');
toast.info('Processing your request');

// With custom duration
toast.success('Saved!', 2000);

// With action button
toast.error('Failed to load data', 7000, {
  label: 'Retry',
  onClick: () => refetch()
});

// Clear all toasts
toast.clearAll();
```

## API Error Handling

### Automatic Error Interception

All API requests automatically handle errors and show toast notifications.

**Location:** `/src/lib/apiClient.ts`

**Features:**
- Automatic error toast notifications
- User-friendly error messages
- Retry mechanism for transient failures
- Network error detection
- Authentication error handling
- Validation error formatting

### Error Message Mapping

User-friendly error messages for common error codes.

**Location:** `/src/lib/errorMessages.ts`

**Supported Error Codes:**
- Authentication: `UNAUTHORIZED`, `INVALID_API_KEY`
- Permissions: `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`
- Resources: `NOT_FOUND`, `RESOURCE_NOT_FOUND`
- Validation: `VALIDATION_ERROR`, `INVALID_REQUEST`
- Rate Limiting: `RATE_LIMIT_EXCEEDED`, `TOO_MANY_REQUESTS`
- Server Errors: `INTERNAL_SERVER_ERROR`, `SERVICE_UNAVAILABLE`
- Network: `NETWORK_ERROR`, `TIMEOUT`

**Usage:**
```tsx
import { getErrorMessage, formatValidationErrors } from '@/lib/errorMessages';

try {
  await apiClient.post('/endpoint', data);
} catch (error) {
  const errorInfo = getErrorMessage(error);
  console.log(errorInfo.message); // User-friendly message
  console.log(errorInfo.canRetry); // Whether retry is recommended
}
```

## Retry Mechanism

Automatic retry for transient failures with exponential backoff.

**Location:** `/src/lib/retryConfig.ts`

**Configuration:**
- Max retries: 3 attempts
- Base delay: 1 second
- Exponential backoff: 1s, 2s, 4s
- Retryable status codes: 408, 429, 500, 502, 503, 504

**Retryable Errors:**
- Network errors
- Timeout errors
- Rate limit exceeded (429)
- Server errors (5xx)

**Manual Retry:**
```tsx
import { apiClientSilent } from '@/lib/apiClient';

// Make request without showing error toast
const data = await apiClientSilent({
  url: '/endpoint',
  method: 'GET'
});
```

## Network Status Detection

Monitors online/offline state and shows notifications.

**Location:** `/src/hooks/useNetworkStatus.ts`

**Features:**
- Detects when connection is lost
- Shows persistent warning when offline
- Shows success message when connection restored
- Automatically dismisses on reconnection

**Usage:**
```tsx
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

function MyComponent() {
  const { isOnline, wasOffline } = useNetworkStatus();

  if (!isOnline) {
    return <div>You are offline. Please check your connection.</div>;
  }

  return <div>Content...</div>;
}
```

**NetworkStatus Component:**
```tsx
import { NetworkStatus } from '@/components/NetworkStatus';

// Add to layout to show offline indicator
<Layout>
  <NetworkStatus />
  {children}
</Layout>
```

## Best Practices

### 1. API Requests

All API requests automatically show error toasts. No manual error handling needed for most cases:

```tsx
// Automatic error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['items'],
  queryFn: () => apiClient.get('/items')
});
```

### 2. Silent Requests

Use `apiClientSilent` when you want to handle errors manually:

```tsx
import { apiClientSilent } from '@/lib/apiClient';

try {
  const data = await apiClientSilent({ url: '/items' });
} catch (error) {
  // Handle error manually
  toast.error('Custom error message');
}
```

### 3. Success Notifications

Always show success toasts for user actions:

```tsx
const handleSave = async () => {
  try {
    await apiClient.post('/items', data);
    toast.success('Item saved successfully');
  } catch {
    // Error automatically shown by interceptor
  }
};
```

### 4. Form Validation

Show validation errors with warning toasts:

```tsx
const handleSubmit = (data) => {
  if (!data.email) {
    toast.warning('Email is required');
    return;
  }
  // Continue with submission
};
```

### 5. Error Boundaries

Use error boundaries for sections that might fail independently:

```tsx
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => console.error('Section error:', error)}
>
  <ComplexFeature />
</ErrorBoundary>
```

## Error Logging

### Development

All errors are logged to console with detailed information:
- Request URL and method
- Status code
- Error response data
- Stack traces (for React errors)

### Production

Errors can be sent to external logging services:

```tsx
// In ErrorBoundary
<ErrorBoundary
  onError={(error, errorInfo) => {
    if (import.meta.env.PROD) {
      // Send to error tracking service
      Sentry.captureException(error, {
        contexts: { react: errorInfo }
      });
    }
  }}
>
  <App />
</ErrorBoundary>
```

## Testing Error Handling

### 1. Test Network Errors

Disconnect your network to test offline behavior.

### 2. Test API Errors

Use Chrome DevTools to throttle network or block requests.

### 3. Test React Errors

Throw an error in a component to test ErrorBoundary:

```tsx
function TestError() {
  throw new Error('Test error');
}
```

### 4. Test Retry Mechanism

Return 503 from API endpoint to trigger retry.

### 5. Test Toast Queue

Trigger multiple errors quickly to test queue management.

## Accessibility

All error handling components follow WCAG 2.1 AA standards:

- Toast notifications use `role="alert"` and `aria-live`
- Error messages are announced to screen readers
- All interactive elements are keyboard accessible
- Focus management in error boundaries
- Sufficient color contrast for error states

## Configuration

Error handling behavior can be configured via environment variables:

```env
# API timeout (milliseconds)
VITE_API_TIMEOUT=30000

# Max retry attempts
VITE_API_RETRY_ATTEMPTS=3

# Retry delay (milliseconds)
VITE_API_RETRY_DELAY=1000

# Toast duration (milliseconds)
VITE_TOAST_DURATION=5000

# Enable debug logging
VITE_ENABLE_DEBUG=true
```

## Summary

The error handling system provides:
- Automatic error detection and reporting
- User-friendly error messages
- Automatic retry for transient failures
- Network status monitoring
- Accessible toast notifications
- Comprehensive error logging
- Global error boundaries

This ensures users receive clear feedback on errors while maintaining a smooth user experience.
