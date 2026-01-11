import axios, { AxiosError } from 'axios';
import type { APIError } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1/public';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
      // Clear auth on unauthorized
      localStorage.removeItem('apiKey');
      window.location.href = '/login';
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
