/**
 * Application Configuration
 *
 * This module provides centralized configuration management with:
 * - Environment variable validation
 * - Type-safe configuration access
 * - Runtime validation on app startup
 * - Clear error messages for missing/invalid config
 */

// Configuration error class for better error handling
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Helper functions for parsing environment variables
const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Invalid number value: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
};

const parseString = (value: string | undefined, defaultValue: string): string => {
  return value !== undefined && value !== '' ? value : defaultValue;
};

/**
 * Validate required environment variables
 * Throws ConfigurationError if any required variables are missing
 */
const validateRequiredEnvVars = (): void => {
  const requiredVars: Array<{ key: string; value: string | undefined; description: string }> = [
    {
      key: 'VITE_API_BASE_URL',
      value: import.meta.env.VITE_API_BASE_URL,
      description: 'Backend API base URL',
    },
  ];

  const missingVars = requiredVars.filter(({ value }) => !value || value === '');

  if (missingVars.length > 0) {
    const errorMessages = missingVars.map(
      ({ key, description }) => `  - ${key}: ${description}`
    );

    throw new ConfigurationError(
      `Missing required environment variables:\n${errorMessages.join('\n')}\n\n` +
      'Please create a .env.local file based on .env.example and set all required variables.'
    );
  }
};

/**
 * Validate API URL format
 */
const validateApiUrl = (url: string): void => {
  try {
    new URL(url);
  } catch {
    throw new ConfigurationError(
      `Invalid API URL format: ${url}\n` +
      'VITE_API_BASE_URL must be a valid URL (e.g., http://localhost:8000 or https://api.example.com)'
    );
  }
};

/**
 * Application Configuration Object
 */
export interface AppConfig {
  // Application metadata
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };

  // API configuration
  api: {
    baseUrl: string;
    versionPath: string;
    fullUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // Authentication configuration
  auth: {
    apiKey?: string;
    projectId?: string;
    storageKey: string;
    sessionExpiry: number;
  };

  // Feature flags
  features: {
    debug: boolean;
    performanceMonitoring: boolean;
    analytics: boolean;
    errorReporting: boolean;
    betaFeatures: boolean;
    mockData: boolean;
    reactQueryDevtools: boolean;
  };

  // UI configuration
  ui: {
    defaultPageSize: number;
    maxFileUploadSize: number;
    refreshInterval: number;
    toastDuration: number;
  };

  // Build configuration
  build: {
    sourceMapsEnabled: boolean;
    dropConsoleLogs: boolean;
  };

  // External services
  services: {
    sentryDsn?: string;
    gaTrackingId?: string;
    posthogKey?: string;
  };

  // Advanced settings
  advanced: {
    basePath: string;
    publicAssetsUrl?: string;
    websocketUrl?: string;
    mockApiDelay: number;
  };

  // Environment checks
  isDev: boolean;
  isProd: boolean;
  isStaging: boolean;
}

/**
 * Create and validate application configuration
 */
const createConfig = (): AppConfig => {
  // Validate required environment variables first
  validateRequiredEnvVars();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Validate API URL format
  validateApiUrl(apiBaseUrl);

  // Allow empty string for VITE_API_VERSION_PATH (when baseURL already includes /v1/public)
  const apiVersionPath = import.meta.env.VITE_API_VERSION_PATH !== undefined
    ? import.meta.env.VITE_API_VERSION_PATH
    : '/v1/public';

  // Construct full API URL
  const fullApiUrl = `${apiBaseUrl}${apiVersionPath}`;

  const environment = parseString(
    import.meta.env.VITE_APP_ENV,
    import.meta.env.MODE
  ) as 'development' | 'staging' | 'production';

  const isDev = environment === 'development' || import.meta.env.DEV;
  const isProd = environment === 'production' || import.meta.env.PROD;
  const isStaging = environment === 'staging';

  return {
    app: {
      name: parseString(import.meta.env.VITE_APP_NAME, 'Agent402'),
      version: parseString(import.meta.env.VITE_APP_VERSION, '1.0.0'),
      environment,
    },

    api: {
      baseUrl: apiBaseUrl,
      versionPath: apiVersionPath,
      fullUrl: fullApiUrl,
      timeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 30000),
      retryAttempts: parseNumber(import.meta.env.VITE_API_RETRY_ATTEMPTS, 3),
      retryDelay: parseNumber(import.meta.env.VITE_API_RETRY_DELAY, 1000),
    },

    auth: {
      apiKey: import.meta.env.VITE_API_KEY,
      projectId: import.meta.env.VITE_PROJECT_ID,
      storageKey: parseString(
        import.meta.env.VITE_AUTH_STORAGE_KEY,
        'agent402_auth_token'
      ),
      sessionExpiry: parseNumber(import.meta.env.VITE_SESSION_EXPIRY, 86400000),
    },

    features: {
      debug: parseBoolean(import.meta.env.VITE_ENABLE_DEBUG, isDev),
      performanceMonitoring: parseBoolean(
        import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING,
        false
      ),
      analytics: parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, false),
      errorReporting: parseBoolean(
        import.meta.env.VITE_ENABLE_ERROR_REPORTING,
        false
      ),
      betaFeatures: parseBoolean(import.meta.env.VITE_ENABLE_BETA_FEATURES, false),
      mockData: parseBoolean(import.meta.env.VITE_ENABLE_MOCK_DATA, false),
      reactQueryDevtools: parseBoolean(
        import.meta.env.VITE_ENABLE_REACT_QUERY_DEVTOOLS,
        isDev
      ),
    },

    ui: {
      defaultPageSize: parseNumber(import.meta.env.VITE_DEFAULT_PAGE_SIZE, 20),
      maxFileUploadSize: parseNumber(
        import.meta.env.VITE_MAX_FILE_UPLOAD_SIZE,
        10485760
      ),
      refreshInterval: parseNumber(import.meta.env.VITE_REFRESH_INTERVAL, 30000),
      toastDuration: parseNumber(import.meta.env.VITE_TOAST_DURATION, 5000),
    },

    build: {
      sourceMapsEnabled: parseBoolean(
        import.meta.env.VITE_ENABLE_PROD_SOURCE_MAPS,
        false
      ),
      dropConsoleLogs: parseBoolean(import.meta.env.VITE_DROP_CONSOLE_PROD, true),
    },

    services: {
      sentryDsn: import.meta.env.VITE_SENTRY_DSN,
      gaTrackingId: import.meta.env.VITE_GA_TRACKING_ID,
      posthogKey: import.meta.env.VITE_POSTHOG_KEY,
    },

    advanced: {
      basePath: parseString(import.meta.env.VITE_BASE_PATH, '/'),
      publicAssetsUrl: import.meta.env.VITE_PUBLIC_ASSETS_URL,
      websocketUrl: import.meta.env.VITE_WEBSOCKET_URL,
      mockApiDelay: parseNumber(import.meta.env.VITE_MOCK_API_DELAY, 500),
    },

    isDev,
    isProd,
    isStaging,
  };
};

/**
 * Initialize and export configuration
 * This will throw an error if required environment variables are missing
 */
let config: AppConfig;

try {
  config = createConfig();

  // Log configuration in development mode
  if (config.features.debug) {
    console.group('Application Configuration');
    console.log('Environment:', config.app.environment);
    console.log('API URL:', config.api.fullUrl);
    console.log('Version:', config.app.version);
    console.log('Features:', config.features);
    console.groupEnd();
  }
} catch (error) {
  if (error instanceof ConfigurationError) {
    // Display user-friendly error message
    console.error('\n='.repeat(80));
    console.error('CONFIGURATION ERROR');
    console.error('='.repeat(80));
    console.error(error.message);
    console.error('='.repeat(80) + '\n');
  }
  throw error;
}

// Export the validated configuration
export { config };

// Export default for backwards compatibility
export default config;

/**
 * Validate configuration at runtime
 * Call this function during app initialization to ensure all config is valid
 */
export const validateConfig = (): boolean => {
  try {
    validateRequiredEnvVars();
    validateApiUrl(config.api.baseUrl);
    return true;
  } catch (error) {
    console.error('Configuration validation failed:', error);
    return false;
  }
};

/**
 * Get configuration value with type safety
 * Useful for accessing nested configuration with autocomplete
 */
export const getConfig = (): AppConfig => config;

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => {
  return config.features[feature];
};

/**
 * Get API endpoint URL
 */
export const getApiUrl = (path: string = ''): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.api.fullUrl}${cleanPath}`;
};
