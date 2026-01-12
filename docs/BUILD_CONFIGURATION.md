# Build Configuration Guide

This guide explains the build system, optimization strategies, and performance monitoring for the Agent-402 frontend.

## Table of Contents

- [Build Scripts](#build-scripts)
- [Build Optimization](#build-optimization)
- [Bundle Analysis](#bundle-analysis)
- [Source Maps](#source-maps)
- [Code Splitting](#code-splitting)
- [Performance Optimization](#performance-optimization)
- [Production Checklist](#production-checklist)

## Build Scripts

### Available Commands

```bash
# Development
npm run dev              # Start development server with HMR
npm run typecheck        # Run TypeScript type checking

# Build Commands
npm run build            # Standard production build
npm run build:dev        # Development build (faster, larger)
npm run build:staging    # Staging build (optimized with source maps)
npm run build:prod       # Production build (fully optimized)

# Analysis & Preview
npm run build:analyze    # Build and open bundle analyzer
npm run preview          # Preview production build locally
npm run preview:staging  # Preview staging build locally

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
```

### Build Command Comparison

| Command | Minification | Source Maps | Console Logs | Use Case |
|---------|-------------|-------------|--------------|----------|
| `build:dev` | esbuild (fast) | Yes | Kept | Testing build process |
| `build:staging` | terser | Yes | Kept | Pre-production testing |
| `build:prod` | terser (max) | No | Removed | Production deployment |

## Build Optimization

### Automatic Optimizations

The build system automatically applies these optimizations:

1. **Minification**
   - JavaScript: Terser with aggressive settings
   - CSS: PostCSS with cssnano
   - HTML: Built-in Vite minification

2. **Tree Shaking**
   - Dead code elimination
   - Unused exports removal
   - Side-effect-free module detection

3. **Code Splitting**
   - Automatic dynamic import splitting
   - Vendor chunk separation
   - Route-based code splitting

4. **Asset Optimization**
   - Image optimization (WebP support)
   - Font subsetting
   - CSS code splitting

### Manual Chunk Configuration

Vendors are split into separate chunks for better caching:

```
vendor-react.js     - React and React DOM
vendor-router.js    - React Router
vendor-query.js     - TanStack Query
vendor-axios.js     - Axios HTTP client
vendor-icons.js     - Lucide React icons
vendor-misc.js      - Other dependencies
```

Benefits:
- Better browser caching
- Parallel loading
- Smaller initial bundle
- Faster page loads for returning users

## Bundle Analysis

### Analyzing Your Bundle

Generate a visual bundle size report:

```bash
npm run build:analyze
```

This creates `dist/stats.html` with:
- Interactive treemap visualization
- Gzip and Brotli sizes
- Dependency relationships
- Chunk composition

### Interpreting the Report

1. **Identify Large Dependencies**
   - Look for unexpectedly large packages
   - Consider alternatives or lazy loading
   - Check if dependencies are tree-shakeable

2. **Verify Code Splitting**
   - Each route should have its own chunk
   - Shared code should be in common chunks
   - Vendor code should be separated

3. **Check Compression Ratios**
   - Good compression: 70-80% size reduction
   - Poor compression: <50% reduction
   - Indicates binary data or pre-compressed content

### Bundle Size Targets

| Chunk Type | Target Size (gzip) | Warning Level |
|-----------|-------------------|---------------|
| Initial bundle | <200 KB | 250 KB |
| Vendor chunks | <150 KB each | 200 KB |
| Route chunks | <50 KB | 100 KB |
| Total bundle | <500 KB | 1 MB |

## Source Maps

### Source Map Configuration

Source maps are configured per environment:

- **Development**: Always enabled (inline)
- **Staging**: Enabled (separate files)
- **Production**: Disabled by default

### Enabling Production Source Maps

For debugging production issues:

```bash
# .env.production.local
VITE_ENABLE_PROD_SOURCE_MAPS=true
```

Warning: Source maps can expose your source code. Use only when necessary and:
- Upload to error tracking service only
- Restrict access in web server configuration
- Remove after debugging is complete

### Source Map Types

Vite uses these source map types:

- Development: `inline-source-map` (fastest rebuild)
- Staging: `source-map` (complete, separate files)
- Production: `hidden-source-map` (if enabled)

## Code Splitting

### Automatic Route Splitting

React Router routes are automatically split:

```typescript
// Automatic code splitting
const Overview = lazy(() => import('./pages/Overview'));
const RunDetail = lazy(() => import('./pages/RunDetail'));
```

Each route loads only when visited, reducing initial bundle size.

### Manual Code Splitting

For large components or features:

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./components/HeavyComponent'));

function MyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Best Practices

1. **Split by Route**: Each route should be a separate chunk
2. **Split Large Dependencies**: Lazy load heavy libraries
3. **Split Below the Fold**: Defer non-critical content
4. **Don't Over-Split**: Too many chunks can hurt performance

## Performance Optimization

### Build Performance

Optimize build speed:

1. **Use Development Build**
   ```bash
   npm run build:dev  # Faster than production build
   ```

2. **Parallel Processing**
   - Vite uses esbuild (Go-based, very fast)
   - Automatic parallel terser minification

3. **Incremental Builds**
   - Vite caches dependencies in `node_modules/.vite`
   - Clear cache if builds are inconsistent

### Runtime Performance

Optimizations applied at build time:

1. **Console Log Removal**
   - `console.log()` removed in production
   - `console.warn()` and `console.error()` kept

2. **PropTypes Removal**
   - PropTypes stripped in production
   - Reduces bundle size

3. **Dead Code Elimination**
   - Unused code removed
   - Development-only code stripped

4. **Constant Folding**
   - `if (process.env.NODE_ENV === 'production')` resolved at build time
   - Unreachable code eliminated

### Monitoring Performance

Track build performance:

```bash
# Time the build
time npm run build

# Check bundle sizes
ls -lh dist/assets/js/
```

Expected build times:
- Development: 5-15 seconds
- Staging: 15-30 seconds
- Production: 20-40 seconds

## Production Checklist

Before deploying to production:

### Build Verification

- [ ] Run `npm run build:prod` successfully
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Bundle size under 1 MB total (gzipped)

### Configuration Verification

- [ ] `VITE_API_BASE_URL` points to production API
- [ ] `VITE_APP_ENV=production` is set
- [ ] Console logs disabled (`VITE_DROP_CONSOLE_PROD=true`)
- [ ] Debug mode disabled (`VITE_ENABLE_DEBUG=false`)
- [ ] Source maps disabled (unless needed for debugging)

### Performance Verification

- [ ] Run bundle analysis (`npm run build:analyze`)
- [ ] Check for unexpectedly large chunks
- [ ] Verify code splitting is working
- [ ] Test production build locally (`npm run preview`)

### Security Verification

- [ ] No API keys in environment files
- [ ] No sensitive data in source code
- [ ] `.env.local` in `.gitignore`
- [ ] HTTPS enabled for production

### Testing Verification

- [ ] All tests passing
- [ ] Critical user flows tested
- [ ] Error handling tested
- [ ] API integration tested

## Advanced Configuration

### Custom Chunk Splitting

Modify `vite.config.ts` to customize chunk splitting:

```typescript
manualChunks: (id: string) => {
  if (id.includes('node_modules')) {
    // Your custom splitting logic
    if (id.includes('my-heavy-package')) {
      return 'vendor-heavy';
    }
  }
}
```

### Build Plugins

Add custom Vite plugins in `vite.config.ts`:

```typescript
import customPlugin from 'vite-plugin-custom';

export default defineConfig({
  plugins: [
    react(),
    customPlugin(),
  ],
});
```

### Environment-Specific Optimizations

Create custom optimization per environment:

```typescript
// vite.config.ts
const optimizations = {
  development: { minify: false },
  staging: { minify: 'esbuild' },
  production: { minify: 'terser' },
};

export default defineConfig(({ mode }) => ({
  build: optimizations[mode],
}));
```

## Troubleshooting

### Build Fails

**Problem**: Build fails with memory error

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Slow Builds

**Problem**: Builds take too long

**Solutions**:
1. Clear Vite cache: `rm -rf node_modules/.vite`
2. Use development build: `npm run build:dev`
3. Disable source maps temporarily
4. Check for large dependencies in bundle analyzer

### Large Bundle Size

**Problem**: Bundle exceeds size targets

**Solutions**:
1. Run `npm run build:analyze`
2. Identify large dependencies
3. Use dynamic imports for heavy features
4. Consider lighter alternatives
5. Enable gzip/brotli compression on server

### Missing Chunks

**Problem**: Chunks not splitting as expected

**Solution**:
1. Check dynamic imports use `import()` syntax
2. Verify routes use `lazy()` for code splitting
3. Review `manualChunks` configuration
4. Check for circular dependencies

## Additional Resources

- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Web.dev Performance Guide](https://web.dev/vitals/)
- [Bundle Analyzer Docs](https://github.com/btd/rollup-plugin-visualizer)
- Configuration file: `vite.config.ts`
- Environment variables: `docs/ENVIRONMENT_CONFIGURATION.md`
