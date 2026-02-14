import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

// Get git commit hash for build stamp
function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const commitHash = getGitCommitHash();
  const buildTime = new Date().toISOString();

  return {
    base: '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Build stamp for environment identification
      '__BUILD_STAMP__': JSON.stringify({
        commitHash,
        buildTime,
        env: mode,
      }),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      // Use terser for better minification in production
      minify: isProduction ? 'terser' : 'esbuild',
      terserOptions: isProduction ? {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          passes: 2, // Multiple passes for better compression
        },
        mangle: {
          safari10: true, // Safari 10 compatibility
        },
      } : undefined,
      // Enable source maps only in development
      sourcemap: !isProduction,
      // Chunk size warning limit (500KB target for optimal loading)
      chunkSizeWarningLimit: 500,
      // Target modern browsers for smaller bundles
      target: 'es2020',
      rollupOptions: {
        output: {
          // Optimize chunk file names
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',
          // Use object-based manualChunks for vendor packages to prevent circular dependencies.
          // The function-based approach was causing vendor-react to import from feature chunks,
          // which created circular dependencies and caused "undefined is not an object" errors.
          // Feature chunks will be split automatically by Rollup's code-splitting.
          manualChunks: {
            // Core React - critical path (must be self-contained)
            'vendor-react': ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
            // Router - needed early
            'vendor-router': ['react-router-dom'],
            // DnD Kit - only needed for board interactions
            'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            // Framer Motion - animations (large)
            'vendor-animation': ['framer-motion'],
            // Icons - split to isolate large icon library
            'vendor-icons': ['phosphor-react'],
            // Charts - split echarts (heavy) from recharts for better loading
            'vendor-echarts': ['echarts', 'echarts-for-react'],
            'vendor-recharts': ['recharts'],
            // Excel/spreadsheet
            'vendor-xlsx': ['xlsx'],
            // Socket.io - real-time features
            'vendor-socket': ['socket.io-client'],
            // Virtualization
            'vendor-virtual': ['react-window', 'react-window-infinite-loader'],
            // Authentication
            'vendor-auth': ['@clerk/clerk-react'],
            // AI features
            'vendor-ai': ['@google/generative-ai'],
            // Markdown
            'vendor-markdown': ['react-markdown'],
            // PDF - split canvas from pdf for better loading
            'vendor-canvas': ['html2canvas'],
            'vendor-pdf': ['html2pdf.js'],
          }
        }
      }
    }
  };
});
