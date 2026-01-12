# Error Handling Architecture

Visual representation of the error handling system architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ErrorBoundary (Global)                    │ │
│  │  - Catches React component errors                           │ │
│  │  - Shows fallback UI                                        │ │
│  │  - Logs to error tracking service                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      ToastProvider                          │ │
│  │  - Manages toast queue (max 5)                             │ │
│  │  - Subscribes to toast emitter                             │ │
│  │  - Renders toast notifications                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   NetworkStatus Monitor                     │ │
│  │  - Monitors online/offline state                           │ │
│  │  - Shows persistent warning when offline                   │ │
│  │  - Shows success message on reconnection                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                                │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   API Client Interceptors                   │ │
│  │                                                             │ │
│  │  Request Interceptor:                                       │ │
│  │  • Attach API key from localStorage                        │ │
│  │  • Initialize retry count                                  │ │
│  │                                                             │ │
│  │  Response Interceptor:                                      │ │
│  │  • Handle authentication errors (401)                       │ │
│  │  • Retry logic with exponential backoff                    │ │
│  │  • Transform errors to consistent format                   │ │
│  │  • Emit toast events for errors                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Retry Mechanism                          │ │
│  │  • Max 3 attempts                                           │ │
│  │  • Exponential backoff: 1s, 2s, 4s                         │ │
│  │  • Retryable status codes: 408, 429, 500, 502, 503, 504   │ │
│  │  • Shows retry progress notifications                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Error Processing Layer                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Error Message Mapper                       │ │
│  │  • Maps 30+ error codes to friendly messages               │ │
│  │  • Formats validation errors                               │ │
│  │  • Determines if error is retryable                        │ │
│  │  • Provides context-aware descriptions                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Toast Event Emitter                       │ │
│  │  • Decouples API layer from UI layer                       │ │
│  │  • Emits toast events with type, message, action           │ │
│  │  • Subscribed to by ToastProvider                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Logging Layer                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Development Logging                          │ │
│  │  • Console logging with request context                    │ │
│  │  • Error details and stack traces                          │ │
│  │  • Component error boundaries                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Production Logging                           │ │
│  │  • Error tracking service integration hooks                │ │
│  │  • Sanitized error information                             │ │
│  │  • User impact metrics                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Error Flow Diagram

```
User Action
    │
    ├─▶ API Request ──▶ Request Interceptor
    │                       │
    │                       ├─▶ Attach API Key
    │                       └─▶ Initialize Retry Count
    │                           │
    │                           ▼
    │                   Backend API
    │                           │
    │                           ├─▶ Success ──▶ Return Data
    │                           │
    │                           └─▶ Error
    │                               │
    │                               ▼
    │                       Response Interceptor
    │                               │
    │                               ├─▶ 401 Unauthorized
    │                               │   ├─▶ Clear localStorage
    │                               │   ├─▶ Dispatch logout event
    │                               │   └─▶ Show "Session expired" toast
    │                               │
    │                               ├─▶ Retryable Error (408, 429, 5xx)
    │                               │   ├─▶ Check retry count < 3
    │                               │   ├─▶ Wait (exponential backoff)
    │                               │   ├─▶ Show "Retrying..." toast
    │                               │   └─▶ Retry request
    │                               │
    │                               └─▶ Non-retryable Error
    │                                   │
    │                                   ▼
    │                           Error Message Mapper
    │                                   │
    │                                   ├─▶ Map error code to message
    │                                   ├─▶ Format validation errors
    │                                   └─▶ Determine if retryable
    │                                       │
    │                                       ▼
    │                               Toast Emitter
    │                                       │
    │                                       └─▶ Emit error event
    │                                           │
    │                                           ▼
    │                                   ToastProvider
    │                                           │
    │                                           ├─▶ Add to queue
    │                                           ├─▶ Apply max limit
    │                                           └─▶ Render toast
    │                                               │
    │                                               ├─▶ Show error message
    │                                               ├─▶ Show retry button (if retryable)
    │                                               └─▶ Auto-dismiss after duration
    │
    └─▶ Component Error ──▶ ErrorBoundary
                               │
                               ├─▶ Catch error
                               ├─▶ Log to console (dev)
                               ├─▶ Send to error tracking (prod)
                               └─▶ Show fallback UI
                                   │
                                   ├─▶ Try Again (reset state)
                                   ├─▶ Reload Page (full refresh)
                                   └─▶ Go Home (navigate)
```

## Component Interaction Diagram

```
┌─────────────────┐         ┌──────────────────┐
│  App Component  │────────▶│  ErrorBoundary   │
└─────────────────┘         └──────────────────┘
        │                            │
        │                            ├─▶ Catches React errors
        │                            └─▶ Shows fallback UI
        │
        ├─▶ ToastProvider
        │       │
        │       ├─▶ Subscribes to toastEmitter
        │       ├─▶ Manages toast queue
        │       └─▶ Renders Toast components
        │
        ├─▶ NetworkStatus
        │       │
        │       └─▶ useNetworkStatus hook
        │               │
        │               ├─▶ Listens to online/offline events
        │               └─▶ Shows toast notifications
        │
        └─▶ Page Components
                │
                └─▶ API Calls (via apiClient)
                        │
                        ├─▶ Request Interceptor
                        ├─▶ Response Interceptor
                        └─▶ Retry Logic
                                │
                                └─▶ Toast Emitter
                                        │
                                        └─▶ ToastProvider
```

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Error Data Flow                            │
└──────────────────────────────────────────────────────────────┘

API Error Response
    │
    ├─▶ AxiosError object
    │   ├─▶ response.status (HTTP status code)
    │   ├─▶ response.data (API error object)
    │   │   ├─▶ detail (error message)
    │   │   ├─▶ error_code (error code)
    │   │   └─▶ validation_errors[] (validation details)
    │   └─▶ config (request configuration)
    │
    ▼
Transform to APIError
    │
    ├─▶ detail: string
    ├─▶ error_code: string
    └─▶ validation_errors?: ValidationError[]
    │
    ▼
Error Message Mapper
    │
    ├─▶ getErrorMessage(error)
    │   ├─▶ Check error type
    │   ├─▶ Map error_code to message
    │   ├─▶ Format validation errors
    │   └─▶ Return ErrorMessageResult
    │       ├─▶ message: string
    │       ├─▶ title?: string
    │       └─▶ canRetry: boolean
    │
    ▼
Toast Emitter
    │
    └─▶ emit(type, message, action?)
        │
        ▼
Toast Provider
    │
    ├─▶ Add to queue
    ├─▶ Check max limit (5)
    ├─▶ Assign unique ID
    └─▶ Render Toast
        │
        ├─▶ Icon (based on type)
        ├─▶ Message
        ├─▶ Action button (if provided)
        ├─▶ Close button
        └─▶ Auto-dismiss timer
```

## State Management

```
┌────────────────────────────────────────────────────────────────┐
│                     Toast Queue State                           │
└────────────────────────────────────────────────────────────────┘

ToastProvider State:
    toasts: ToastMessage[]
        │
        ├─▶ id: string (unique identifier)
        ├─▶ type: 'success' | 'error' | 'warning' | 'info'
        ├─▶ message: string
        ├─▶ duration?: number
        └─▶ action?: { label: string, onClick: () => void }

    toastQueue: ToastMessage[] (ref)
        │
        └─▶ Overflow queue when > 5 toasts

Operations:
    showToast(type, message, duration?, action?)
        ├─▶ Create new toast
        ├─▶ Add to toasts if < 5
        └─▶ Add to queue if >= 5

    removeToast(id)
        ├─▶ Remove from toasts
        └─▶ Process next from queue

    clearAll()
        ├─▶ Clear all toasts
        └─▶ Clear queue
```

## Retry State Machine

```
┌────────────────────────────────────────────────────────────────┐
│                   Retry State Machine                           │
└────────────────────────────────────────────────────────────────┘

Initial Request
    │
    ├─▶ _retryCount: 0
    │
    ▼
Request Fails
    │
    ├─▶ Check shouldRetryRequest()
    │   ├─▶ retryCount < maxRetries (3)
    │   ├─▶ Status code is retryable
    │   └─▶ Not cancelled
    │
    ├─▶ YES ──▶ Retry
    │           │
    │           ├─▶ Increment _retryCount
    │           ├─▶ Calculate delay: 1s * 2^retryCount
    │           ├─▶ Show "Retrying (X/3)..." toast
    │           ├─▶ Wait delay
    │           └─▶ Retry request
    │               │
    │               ├─▶ Success ──▶ Return data
    │               └─▶ Fail ──▶ Check retry again
    │
    └─▶ NO ──▶ Final Error
                │
                ├─▶ Format error message
                ├─▶ Show error toast
                └─▶ Reject promise

Retry Delays:
    Attempt 1: 1000ms (1s)
    Attempt 2: 2000ms (2s)
    Attempt 3: 4000ms (4s)
    Max: 10000ms (10s)
```

## Summary

The error handling architecture provides:
- **Multi-layered error catching**: ErrorBoundary, API interceptors, network monitoring
- **Automatic error processing**: Error mapping, formatting, retry logic
- **User notifications**: Toast queue management, action buttons, auto-dismiss
- **Developer experience**: Console logging, error tracking hooks, TypeScript types
- **Performance**: Queue management, exponential backoff, cancellation support
- **Accessibility**: ARIA attributes, keyboard navigation, screen reader support

This architecture ensures comprehensive error handling across the entire application.
