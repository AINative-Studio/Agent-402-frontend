import axios, { AxiosError, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import type { APIError } from './types';
import config from './config';
import { getErrorMessage, formatValidationErrors } from './errorMessages';
import { shouldRetryRequest, getRetryDelay } from './retryConfig';

// Extend Axios config to include retry count
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retryCount?: number;
    _skipErrorToast?: boolean;
}

export const apiClient = axios.create({
    baseURL: config.api.fullUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: config.api.timeout,
});

// Toast event emitter for error notifications
class ToastEventEmitter {
    private handlers: ((type: string, message: string, action?: { label: string; onClick: () => void }) => void)[] = [];

    subscribe(handler: (type: string, message: string, action?: { label: string; onClick: () => void }) => void) {
        this.handlers.push(handler);
        return () => {
            this.handlers = this.handlers.filter(h => h !== handler);
        };
    }

    emit(type: string, message: string, action?: { label: string; onClick: () => void }) {
        this.handlers.forEach(handler => handler(type, message, action));
    }
}

export const toastEmitter = new ToastEventEmitter();

// Request interceptor - attach Bearer token and initialize retry count
apiClient.interceptors.request.use(
    (config: ExtendedAxiosRequestConfig) => {
        // Use JWT token from localStorage (new auth system)
        const token = localStorage.getItem('agent402_access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Initialize retry count if not present
        if (config._retryCount === undefined) {
            config._retryCount = 0;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors with retry and toast notifications
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<APIError>) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // Log errors in development
        if (config.features.debug) {
            console.error('[API Error]', {
                url: originalRequest?.url,
                method: originalRequest?.method,
                status: error.response?.status,
                error: error.response?.data || error.message,
            });
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
            localStorage.removeItem('agent402_access_token');
            localStorage.removeItem('agent402_user');
            window.dispatchEvent(new CustomEvent('auth:logout'));

            if (!originalRequest?._skipErrorToast) {
                toastEmitter.emit('error', 'Your session has expired. Please log in again.');
            }

            return Promise.reject({
                detail: 'Authentication required',
                error_code: 'UNAUTHORIZED',
            } as APIError);
        }

        // Retry logic
        const retryCount = originalRequest?._retryCount || 0;

        if (originalRequest && shouldRetryRequest(error, retryCount)) {
            originalRequest._retryCount = retryCount + 1;
            const delay = getRetryDelay(retryCount);

            // Show retry notification
            if (!originalRequest._skipErrorToast) {
                toastEmitter.emit(
                    'info',
                    `Request failed. Retrying (${retryCount + 1}/3)...`
                );
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            return apiClient(originalRequest);
        }

        // Transform to consistent error format
        const apiError: APIError = error.response?.data || {
            detail: error.message || 'An unexpected error occurred',
            error_code: error.code || 'UNKNOWN_ERROR',
        };

        // Show error toast notification (if not explicitly skipped)
        if (!originalRequest?._skipErrorToast) {
            const errorInfo = getErrorMessage(apiError);
            const errorMessage = apiError.validation_errors
                ? formatValidationErrors(apiError)
                : errorInfo.message;

            // Add retry action if error is retryable
            const retryAction = errorInfo.canRetry && originalRequest
                ? {
                    label: 'Retry',
                    onClick: () => {
                        if (originalRequest) {
                            const retryConfig = { ...originalRequest, _retryCount: 0 };
                            apiClient(retryConfig);
                        }
                    }
                }
                : undefined;

            toastEmitter.emit('error', errorMessage, retryAction);
        }

        return Promise.reject(apiError);
    }
);

// Helper function to make requests without showing error toasts
export function apiClientSilent<T = unknown>(requestConfig: AxiosRequestConfig): Promise<T> {
    return apiClient({
        ...requestConfig,
        _skipErrorToast: true,
    } as ExtendedAxiosRequestConfig);
}

export default apiClient;
