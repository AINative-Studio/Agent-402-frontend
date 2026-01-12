# Environment Configuration Guide

This guide explains how to configure the Agent-402 frontend application for different environments using environment variables.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Files](#environment-files)
- [Available Variables](#available-variables)
- [Configuration Validation](#configuration-validation)
- [Build Modes](#build-modes)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Update `VITE_API_BASE_URL` with your backend API URL:
   ```bash
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Files

The application uses multiple environment files based on the build mode:

### File Priority (Highest to Lowest)

1. `.env.local` - Local overrides (git-ignored, highest priority)
2. `.env.[mode]` - Mode-specific defaults (committed to git)
3. `.env` - Global defaults (committed to git)
4. `.env.example` - Template and documentation (committed to git)

### Environment File Usage

| File | Purpose | Git Tracked | When Loaded |
|------|---------|-------------|-------------|
| `.env.example` | Documentation and template | Yes | Never (reference only) |
| `.env` | Global defaults for all environments | Yes | Always |
| `.env.local` | Local development overrides | No | Always (overrides all) |
| `.env.development` | Development mode defaults | Yes | `npm run dev` |
| `.env.staging` | Staging mode defaults | Yes | `npm run build:staging` |
| `.env.production` | Production mode defaults | Yes | `npm run build:prod` |

### Creating Your Local Configuration

For local development, create a `.env.local` file:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEBUG=true
VITE_ENABLE_REACT_QUERY_DEVTOOLS=true
```

## Available Variables

### Required Variables

These variables **must** be set for the application to run:

- `VITE_API_BASE_URL` - Backend API base URL

### Application Configuration

```bash
# Application name shown in UI
VITE_APP_NAME=Agent402

# Application version
VITE_APP_VERSION=1.0.0

# Environment mode (development, staging, production)
VITE_APP_ENV=development
```

### API Configuration

```bash
# Backend API base URL (REQUIRED)
VITE_API_BASE_URL=http://localhost:8000

# API version path (default: /v1/public)
VITE_API_VERSION_PATH=/v1/public

# Request timeout in milliseconds (default: 30000)
VITE_API_TIMEOUT=30000

# Number of retry attempts for failed requests (default: 3)
VITE_API_RETRY_ATTEMPTS=3

# Initial retry delay in milliseconds (default: 1000)
VITE_API_RETRY_DELAY=1000
```

### Authentication Configuration

```bash
# Optional API key for development (never commit real keys)
VITE_API_KEY=

# Optional default project ID for development
VITE_PROJECT_ID=

# Storage key for auth tokens (default: agent402_auth_token)
VITE_AUTH_STORAGE_KEY=agent402_auth_token

# Session expiry in milliseconds (default: 86400000 = 24 hours)
VITE_SESSION_EXPIRY=86400000
```

### Feature Flags

```bash
# Enable debug mode (default: true in dev, false in prod)
VITE_ENABLE_DEBUG=false

# Enable performance monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=false

# Enable analytics tracking
VITE_ENABLE_ANALYTICS=false

# Enable error reporting (e.g., Sentry)
VITE_ENABLE_ERROR_REPORTING=false

# Enable beta/experimental features
VITE_ENABLE_BETA_FEATURES=false

# Use mock data instead of API calls
VITE_ENABLE_MOCK_DATA=false

# Show React Query devtools (default: true in dev)
VITE_ENABLE_REACT_QUERY_DEVTOOLS=false
```

### UI Configuration

```bash
# Default items per page in lists (default: 20)
VITE_DEFAULT_PAGE_SIZE=20

# Max file upload size in bytes (default: 10485760 = 10MB)
VITE_MAX_FILE_UPLOAD_SIZE=10485760

# Auto-refresh interval in milliseconds (default: 30000 = 30s, 0 to disable)
VITE_REFRESH_INTERVAL=30000

# Toast notification duration in milliseconds (default: 5000)
VITE_TOAST_DURATION=5000
```

### Build Configuration

```bash
# Enable source maps in production builds (default: false)
VITE_ENABLE_PROD_SOURCE_MAPS=false

# Remove console.log in production (default: true)
VITE_DROP_CONSOLE_PROD=true

# Bundle size warning limit in KB (default: 1000)
VITE_CHUNK_SIZE_WARNING_LIMIT=1000
```

### External Services

```bash
# Sentry DSN for error tracking
VITE_SENTRY_DSN=

# Google Analytics tracking ID
VITE_GA_TRACKING_ID=

# PostHog API key for product analytics
VITE_POSTHOG_KEY=
```

### Advanced Configuration

```bash
# Base path for deployment (e.g., /app/ for subdirectory)
VITE_BASE_PATH=/

# CDN URL for static assets
VITE_PUBLIC_ASSETS_URL=

# WebSocket URL for real-time features
VITE_WEBSOCKET_URL=

# Simulated API delay for mock data (default: 500ms)
VITE_MOCK_API_DELAY=500
```

## Configuration Validation

### Automatic Validation

The application validates configuration on startup. If required variables are missing or invalid, you'll see an error like:

```
================================================================================
CONFIGURATION ERROR
================================================================================
Missing required environment variables:
  - VITE_API_BASE_URL: Backend API base URL

Please create a .env.local file based on .env.example and set all required variables.
================================================================================
```

### Manual Validation

You can also validate configuration programmatically:

```typescript
import { validateConfig, config } from '@/lib/config';

// Check if config is valid
if (validateConfig()) {
  console.log('Configuration is valid');
  console.log('API URL:', config.api.fullUrl);
}
```

### Type-Safe Access

TypeScript provides full type safety for all configuration values:

```typescript
import { config, isFeatureEnabled, getApiUrl } from '@/lib/config';

// Access typed configuration
const apiUrl = config.api.fullUrl;
const debugMode = config.features.debug;

// Check feature flags
if (isFeatureEnabled('debug')) {
  console.log('Debug mode enabled');
}

// Build API URLs
const endpoint = getApiUrl('/projects');
// Returns: http://localhost:8000/v1/public/projects
```

## Build Modes

### Development Mode

```bash
# Start development server
npm run dev

# Build development bundle
npm run build:dev
```

**Characteristics:**
- Fast compilation with esbuild
- Source maps enabled
- Hot Module Replacement (HMR)
- React Query devtools enabled
- Debug mode enabled
- Console logs preserved

### Staging Mode

```bash
# Build staging bundle
npm run build:staging

# Preview staging build
npm run preview:staging
```

**Characteristics:**
- Production-like optimization
- Source maps enabled for debugging
- Error reporting enabled
- Performance monitoring enabled
- Console logs preserved
- Minified but readable

### Production Mode

```bash
# Build production bundle
npm run build:prod

# Analyze bundle size
npm run build:analyze
```

**Characteristics:**
- Maximum optimization with terser
- Source maps disabled (configurable)
- Console logs removed
- Error reporting enabled
- Analytics enabled
- Fully minified
- Tree-shaking and dead code elimination

## Common Scenarios

### Local Development with Remote API

```bash
# .env.local
VITE_API_BASE_URL=https://dev-api.agent402.com
VITE_ENABLE_DEBUG=true
```

### Using Mock Data

```bash
# .env.local
VITE_ENABLE_MOCK_DATA=true
VITE_MOCK_API_DELAY=500
```

### Debugging Production Issues

```bash
# .env.production.local
VITE_ENABLE_PROD_SOURCE_MAPS=true
VITE_DROP_CONSOLE_PROD=false
```

### Custom API Version

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION_PATH=/v2/api
# Full URL will be: http://localhost:8000/v2/api
```

### Deploying to Subdirectory

```bash
VITE_BASE_PATH=/agent402/
VITE_API_BASE_URL=https://example.com/api
```

### Using CDN for Assets

```bash
VITE_PUBLIC_ASSETS_URL=https://cdn.agent402.com
```

## Troubleshooting

### Configuration Error on Startup

**Problem:** App fails to start with "CONFIGURATION ERROR"

**Solution:**
1. Ensure `.env.local` exists
2. Verify `VITE_API_BASE_URL` is set
3. Check URL format (must include protocol: `http://` or `https://`)

### Environment Variables Not Updating

**Problem:** Changes to `.env` files not reflected in app

**Solution:**
1. Restart the dev server (`npm run dev`)
2. Clear browser cache
3. Ensure variable name starts with `VITE_`

### API Requests Failing

**Problem:** All API requests return 404 or connection errors

**Solution:**
1. Verify `VITE_API_BASE_URL` is correct
2. Check if backend server is running
3. Verify `VITE_API_VERSION_PATH` matches backend
4. Check browser console for full URL being called

### Feature Flag Not Working

**Problem:** Feature flag doesn't change behavior

**Solution:**
1. Ensure variable starts with `VITE_`
2. Use exact string values: `"true"` or `"false"`
3. Restart dev server after changes
4. Check code uses `config.features.featureName` or `isFeatureEnabled('featureName')`

### Build Fails with Type Errors

**Problem:** TypeScript errors about `import.meta.env`

**Solution:**
1. Ensure `vite-env.d.ts` includes all environment variables
2. Add new variables to `ImportMetaEnv` interface
3. Restart TypeScript server in your IDE

## Bundle Analysis

After building for production, analyze bundle size:

```bash
npm run build:analyze
```

This generates `dist/stats.html` with a visual treemap of your bundle composition. Use it to:

- Identify large dependencies
- Find optimization opportunities
- Verify code splitting is working
- Check gzip/brotli sizes

## Security Best Practices

1. **Never commit sensitive data:**
   - Add `.env.local` to `.gitignore`
   - Never commit API keys, secrets, or tokens
   - Use `.env.example` for documentation only

2. **Use different keys per environment:**
   - Development: Test/sandbox keys
   - Staging: Staging-specific keys
   - Production: Production keys with restricted permissions

3. **Validate all environment variables:**
   - The config system validates required vars
   - Add custom validation in `src/lib/config.ts` for complex requirements

4. **Limit exposed variables:**
   - Only prefix with `VITE_` what needs to be public
   - Server-side secrets should never have `VITE_` prefix
   - Remember: All `VITE_*` variables are exposed to the client

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Agent-402 Backend API Documentation](../backend/API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- Source code: `src/lib/config.ts`
- Type definitions: `src/vite-env.d.ts`
