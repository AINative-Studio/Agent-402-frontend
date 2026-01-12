import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { ConfigEnv, UserConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');

  // Parse environment-specific build settings
  const enableProdSourceMaps = env.VITE_ENABLE_PROD_SOURCE_MAPS === 'true';
  const dropConsoleProd = env.VITE_DROP_CONSOLE_PROD !== 'false'; // Default true
  const chunkSizeWarningLimit = parseInt(
    env.VITE_CHUNK_SIZE_WARNING_LIMIT || '1000',
    10
  );

  const isProd = mode === 'production';
  const isDev = mode === 'development';

  console.log(`Building for ${mode} mode...`);

  return {
    plugins: [
      react({
        // Enable React Fast Refresh in development
        fastRefresh: isDev,
      }),
      // Bundle size analyzer - generates stats.html
      isProd &&
        visualizer({
          open: false, // Don't auto-open browser
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap', // Options: sunburst, treemap, network
        }),
    ].filter(Boolean),

    // Path aliases for cleaner imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        buffer: 'buffer/',
      },
    },

    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      global: 'globalThis',
    },

    // Optimize dependencies
    optimizeDeps: {
      // Exclude lucide-react from pre-bundling for better tree-shaking
      exclude: ['lucide-react'],
      // Include commonly used dependencies
      include: ['react', 'react-dom', 'react-router-dom', 'buffer'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },

    // Production build configuration
    build: {
      // Output directory
      outDir: 'dist',

      // Enable/disable source maps based on environment
      sourcemap: isDev ? true : enableProdSourceMaps,

      // Use esbuild for faster builds in development, terser for better compression in production
      minify: isProd ? 'terser' : 'esbuild',

      // Terser options for production
      terserOptions: isProd
        ? {
            compress: {
              // Drop console.log in production (keeps warn/error)
              drop_console: dropConsoleProd,
              drop_debugger: true,
              // Remove comments
              passes: 2,
              // Additional optimizations
              pure_funcs: dropConsoleProd ? ['console.log', 'console.debug'] : [],
            },
            mangle: {
              // Mangle private properties for smaller bundle
              properties: {
                regex: /^_/,
              },
            },
            format: {
              // Remove comments
              comments: false,
            },
          }
        : undefined,

      // Rollup configuration for chunk splitting
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: (id: string) => {
            // Vendor chunk: Core React libraries
            if (id.includes('node_modules')) {
              // Separate React and React DOM
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }

              // Separate React Router
              if (id.includes('react-router-dom')) {
                return 'vendor-router';
              }

              // Separate TanStack Query
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query';
              }

              // Separate Axios
              if (id.includes('axios')) {
                return 'vendor-axios';
              }

              // Separate Lucide icons
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }

              // All other node_modules go to vendor-misc
              return 'vendor-misc';
            }
          },

          // Asset file naming with content hash
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.');
            let extType = info?.[info.length - 1] || '';

            // Organize assets by type
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name || '')) {
              extType = 'images';
            } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
              extType = 'fonts';
            } else if (/\.css$/i.test(assetInfo.name || '')) {
              return 'assets/css/[name]-[hash][extname]';
            }

            return `assets/${extType}/[name]-[hash][extname]`;
          },

          // Chunk file naming with content hash
          chunkFileNames: 'assets/js/[name]-[hash].js',

          // Entry file naming with content hash
          entryFileNames: 'assets/js/[name]-[hash].js',
        },

        // External dependencies (if needed for SSR or library mode)
        external: [],
      },

      // Chunk size warnings
      chunkSizeWarningLimit,

      // Report compressed size (can be slow for large apps)
      reportCompressedSize: isProd,

      // CSS code splitting
      cssCodeSplit: true,

      // Target modern browsers for better optimization
      target: isProd ? 'es2015' : 'esnext',

      // Emit manifest for asset tracking
      manifest: isProd,

      // Clean output directory before build
      emptyOutDir: true,
    },

    // Asset optimization
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp'],

    // CSS configuration
    css: {
      // CSS modules configuration
      modules: {
        localsConvention: 'camelCase',
      },
      // PostCSS configuration (uses postcss.config.js)
      postcss: './postcss.config.js',
      // Generate source maps for CSS
      devSourcemap: isDev,
    },

    // Server configuration for development
    server: {
      port: 5173,
      strictPort: false,
      host: true,
      // Enable CORS for API requests
      cors: true,
      // Open browser on server start
      open: false,
      // HMR configuration
      hmr: {
        overlay: true,
      },
      // Proxy API requests in development (if needed)
      proxy: env.VITE_API_PROXY_ENABLED === 'true'
        ? {
            '/api': {
              target: env.VITE_API_BASE_URL || 'http://localhost:8000',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },

    // Preview configuration
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
      cors: true,
      open: false,
    },

    // Enable esbuild for faster builds
    esbuild: {
      // Drop console and debugger in production
      drop: isProd && dropConsoleProd ? ['console', 'debugger'] : [],
      // Minify identifiers
      minifyIdentifiers: isProd,
      minifySyntax: isProd,
      minifyWhitespace: isProd,
      // Legal comments
      legalComments: 'none',
    },

    // Performance optimizations
    experimental: {
      // Enable render built-in for faster dev server (Vite 5+)
      renderBuiltUrl(filename: string) {
        // Use CDN URL if configured
        if (env.VITE_PUBLIC_ASSETS_URL) {
          return `${env.VITE_PUBLIC_ASSETS_URL}/${filename}`;
        }
        return `/${filename}`;
      },
    },

    // JSON configuration
    json: {
      // Generate named exports
      namedExports: true,
      // Stringify JSON (smaller bundle)
      stringify: isProd,
    },

    // Log level
    logLevel: isDev ? 'info' : 'warn',

    // Clear screen on build
    clearScreen: true,
  };
});
