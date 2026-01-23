import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';

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
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
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
          manualChunks: (id) => {
            // Core React - critical path
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            // Router - needed early
            if (id.includes('node_modules/react-router')) {
              return 'vendor-router';
            }
            // DnD Kit - only needed for board interactions
            if (id.includes('node_modules/@dnd-kit')) {
              return 'vendor-dnd';
            }
            // Framer Motion - animations (large)
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-animation';
            }
            // Icons
            if (id.includes('node_modules/phosphor-react')) {
              return 'vendor-icons';
            }
            // Charts - heavy, lazy load
            if (id.includes('node_modules/echarts') || id.includes('node_modules/recharts')) {
              return 'vendor-charts';
            }
            // Excel/spreadsheet
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
            // Socket.io - real-time features
            if (id.includes('node_modules/socket.io')) {
              return 'vendor-socket';
            }
            // Virtualization
            if (id.includes('node_modules/react-window')) {
              return 'vendor-virtual';
            }
            // Authentication
            if (id.includes('node_modules/@clerk')) {
              return 'vendor-auth';
            }
            // AI features
            if (id.includes('node_modules/@google/generative-ai')) {
              return 'vendor-ai';
            }
            // Markdown
            if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark') || id.includes('node_modules/rehype')) {
              return 'vendor-markdown';
            }
            // PDF generation
            if (id.includes('node_modules/html2canvas') || id.includes('node_modules/html2pdf')) {
              return 'vendor-pdf';
            }
            // Split feature modules
            if (id.includes('/features/board/views/Table/')) {
              return 'feature-table';
            }
            if (id.includes('/features/board/views/Kanban/')) {
              return 'feature-kanban';
            }
            if (id.includes('/features/board/views/Calendar/')) {
              return 'feature-calendar';
            }
            if (id.includes('/features/board/views/GanttChart/')) {
              return 'feature-gantt';
            }
            if (id.includes('/features/inbox/')) {
              return 'feature-inbox';
            }
            if (id.includes('/features/vault/')) {
              return 'feature-vault';
            }
            if (id.includes('/features/mini_company/')) {
              return 'feature-mini-company';
            }
            if (id.includes('/features/supply_chain/')) {
              return 'feature-supply-chain';
            }
            if (id.includes('/features/marketplace/')) {
              return 'feature-marketplace';
            }
            if (id.includes('/features/tools/')) {
              return 'feature-tools';
            }
            if (id.includes('/features/collaboration/')) {
              return 'feature-collab';
            }
          }
        }
      }
    }
  };
});
