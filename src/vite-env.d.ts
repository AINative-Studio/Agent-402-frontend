/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';

  // API Configuration
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_VERSION_PATH: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_RETRY_ATTEMPTS: string;
  readonly VITE_API_RETRY_DELAY: string;

  // Authentication Configuration
  readonly VITE_API_KEY?: string;
  readonly VITE_PROJECT_ID?: string;
  readonly VITE_AUTH_STORAGE_KEY: string;
  readonly VITE_SESSION_EXPIRY: string;

  // Feature Flags
  readonly VITE_ENABLE_DEBUG: string;
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_ERROR_REPORTING: string;
  readonly VITE_ENABLE_BETA_FEATURES: string;

  // UI Configuration
  readonly VITE_DEFAULT_PAGE_SIZE: string;
  readonly VITE_MAX_FILE_UPLOAD_SIZE: string;
  readonly VITE_REFRESH_INTERVAL: string;
  readonly VITE_TOAST_DURATION: string;

  // Development Configuration
  readonly VITE_ENABLE_MOCK_DATA: string;
  readonly VITE_MOCK_API_DELAY: string;
  readonly VITE_ENABLE_REACT_QUERY_DEVTOOLS: string;

  // Build Configuration
  readonly VITE_ENABLE_PROD_SOURCE_MAPS: string;
  readonly VITE_DROP_CONSOLE_PROD: string;
  readonly VITE_CHUNK_SIZE_WARNING_LIMIT: string;

  // External Services
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_POSTHOG_KEY?: string;

  // Advanced Configuration
  readonly VITE_BASE_PATH: string;
  readonly VITE_PUBLIC_ASSETS_URL?: string;
  readonly VITE_WEBSOCKET_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
