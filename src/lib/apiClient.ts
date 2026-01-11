import axios, { AxiosError } from 'axios';
import type { APIError } from './types';
import config from './config';

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach API key
apiClient.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      config.headers['X-API-Key'] = apiKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<APIError>) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized - ProtectedRoute will handle redirect
      localStorage.removeItem('apiKey');
      // Dispatch a custom event so AuthContext can update state
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Transform to consistent error format
    const apiError: APIError = error.response?.data || {
      detail: error.message || 'An unexpected error occurred',
      error_code: 'UNKNOWN_ERROR',
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;
