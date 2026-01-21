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
        },
      } : undefined,
      // Enable source maps only in development
      sourcemap: !isProduction,
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks - split large dependencies
            'vendor-react': ['react', 'react-dom'],
            'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            'vendor-ui': ['framer-motion', 'phosphor-react'],
            'vendor-xlsx': ['xlsx'],
            // Charting libraries - separate chunk
            'vendor-charts': ['echarts', 'echarts-for-react', 'recharts'],
            // Feature chunks - split large features from BoardView
            'feature-chart': [
              './src/features/board/components/chart-builder/ChartBuilderModal.tsx',
              './src/features/board/components/AIChartCard.tsx',
            ],
          }
        }
      }
    }
  };
});
