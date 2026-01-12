import type { APIError } from './types';

export interface ErrorMessageResult {
    message: string;
    title?: string;
    canRetry: boolean;
}

const ERROR_CODE_MESSAGES: Record<string, ErrorMessageResult> = {
    // Authentication errors
    UNAUTHORIZED: {
        message: 'Your session has expired. Please log in again.',
        title: 'Authentication Required',
        canRetry: false,
    },
    INVALID_API_KEY: {
        message: 'Invalid API key. Please check your credentials.',
        title: 'Authentication Failed',
        canRetry: false,
    },
    API_KEY_REQUIRED: {
        message: 'API key is required. Please log in.',
        title: 'Authentication Required',
        canRetry: false,
    },

    // Permission errors
    FORBIDDEN: {
        message: 'You do not have permission to perform this action.',
        title: 'Access Denied',
        canRetry: false,
    },
    INSUFFICIENT_PERMISSIONS: {
        message: 'Your account does not have the required permissions.',
        title: 'Insufficient Permissions',
        canRetry: false,
    },

    // Resource errors
    NOT_FOUND: {
        message: 'The requested resource was not found.',
        title: 'Not Found',
        canRetry: false,
    },
    RESOURCE_NOT_FOUND: {
        message: 'The requested item could not be found.',
        title: 'Not Found',
        canRetry: false,
    },
    PROJECT_NOT_FOUND: {
        message: 'Project not found. Please select a valid project.',
        title: 'Project Not Found',
        canRetry: false,
    },

    // Validation errors
    VALIDATION_ERROR: {
        message: 'Please check your input and try again.',
        title: 'Invalid Input',
        canRetry: false,
    },
    INVALID_REQUEST: {
        message: 'The request contains invalid data.',
        title: 'Invalid Request',
        canRetry: false,
    },
    MISSING_REQUIRED_FIELD: {
        message: 'Please fill in all required fields.',
        title: 'Missing Information',
        canRetry: false,
    },

    // Duplicate/Conflict errors
    DUPLICATE_ENTRY: {
        message: 'An item with this name already exists.',
        title: 'Duplicate Entry',
        canRetry: false,
    },
    CONFLICT: {
        message: 'This action conflicts with existing data.',
        title: 'Conflict',
        canRetry: false,
    },

    // Rate limiting
    RATE_LIMIT_EXCEEDED: {
        message: 'Too many requests. Please wait a moment and try again.',
        title: 'Rate Limit Exceeded',
        canRetry: true,
    },
    TOO_MANY_REQUESTS: {
        message: 'You have made too many requests. Please slow down.',
        title: 'Too Many Requests',
        canRetry: true,
    },

    // Server errors
    INTERNAL_SERVER_ERROR: {
        message: 'An unexpected server error occurred. Please try again.',
        title: 'Server Error',
        canRetry: true,
    },
    SERVICE_UNAVAILABLE: {
        message: 'The service is temporarily unavailable. Please try again later.',
        title: 'Service Unavailable',
        canRetry: true,
    },
    GATEWAY_TIMEOUT: {
        message: 'The request timed out. Please try again.',
        title: 'Timeout',
        canRetry: true,
    },

    // Network errors
    NETWORK_ERROR: {
        message: 'Network connection failed. Please check your internet connection.',
        title: 'Network Error',
        canRetry: true,
    },
    TIMEOUT: {
        message: 'The request took too long. Please try again.',
        title: 'Request Timeout',
        canRetry: true,
    },

    // Database/Storage errors
    DATABASE_ERROR: {
        message: 'A database error occurred. Please try again.',
        title: 'Database Error',
        canRetry: true,
    },
    STORAGE_ERROR: {
        message: 'Failed to save data. Please try again.',
        title: 'Storage Error',
        canRetry: true,
    },

    // Unknown
    UNKNOWN_ERROR: {
        message: 'An unexpected error occurred. Please try again.',
        title: 'Error',
        canRetry: true,
    },
};

export function getErrorMessage(error: unknown): ErrorMessageResult {
    // Handle network errors (no response from server)
    if (isNetworkError(error)) {
        return ERROR_CODE_MESSAGES.NETWORK_ERROR;
    }

    // Handle timeout errors
    if (isTimeoutError(error)) {
        return ERROR_CODE_MESSAGES.TIMEOUT;
    }

    // Handle API errors with error_code
    if (isAPIError(error)) {
        const errorCode = error.error_code?.toUpperCase();

        // Check if we have a predefined message
        if (errorCode && ERROR_CODE_MESSAGES[errorCode]) {
            return ERROR_CODE_MESSAGES[errorCode];
        }

        // Use the detail message from the API if available
        if (error.detail) {
            return {
                message: error.detail,
                canRetry: isRetryableError(error),
            };
        }
    }

    // Handle standard Error objects
    if (error instanceof Error) {
        return {
            message: error.message || 'An unexpected error occurred.',
            canRetry: true,
        };
    }

    // Handle string errors
    if (typeof error === 'string') {
        return {
            message: error,
            canRetry: true,
        };
    }

    // Fallback
    return ERROR_CODE_MESSAGES.UNKNOWN_ERROR;
}

export function isAPIError(error: unknown): error is APIError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'detail' in error &&
        'error_code' in error
    );
}

export function isNetworkError(error: unknown): boolean {
    if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        return (
            err.code === 'ERR_NETWORK' ||
            err.message === 'Network Error' ||
            !navigator.onLine
        );
    }
    return false;
}

export function isTimeoutError(error: unknown): boolean {
    if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        return (
            err.code === 'ECONNABORTED' ||
            err.code === 'ETIMEDOUT' ||
            (typeof err.message === 'string' && err.message.includes('timeout'))
        );
    }
    return false;
}

export function isRetryableError(error: unknown): boolean {
    if (isNetworkError(error) || isTimeoutError(error)) {
        return true;
    }

    if (isAPIError(error)) {
        const retryableCodes = [
            'RATE_LIMIT_EXCEEDED',
            'TOO_MANY_REQUESTS',
            'INTERNAL_SERVER_ERROR',
            'SERVICE_UNAVAILABLE',
            'GATEWAY_TIMEOUT',
            'DATABASE_ERROR',
            'STORAGE_ERROR',
            'TIMEOUT',
        ];
        return retryableCodes.includes(error.error_code?.toUpperCase() || '');
    }

    return false;
}

export function formatValidationErrors(error: APIError): string {
    if (!error.validation_errors || error.validation_errors.length === 0) {
        return error.detail;
    }

    const errors = error.validation_errors
        .map((ve) => {
            const field = ve.loc.slice(1).join('.');
            return `${field}: ${ve.msg}`;
        })
        .join('; ');

    return errors || error.detail;
}
