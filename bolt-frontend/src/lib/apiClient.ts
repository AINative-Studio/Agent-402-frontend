import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/v1/public';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

// Response interceptor for errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle DX Contract errors: { detail, error_code }
    if (error.response?.data?.error_code) {
      // Enhance error with backend error code
      error.errorCode = error.response.data.error_code;
      error.detail = error.response.data.detail;
    }
    return Promise.reject(error);
  }
);
