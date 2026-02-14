import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        // Test environment
        environment: 'jsdom',

        // Global test setup
        globals: true,
        setupFiles: ['./src/test/setup.ts'],

        // Include patterns
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist', 'server'],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/*.test.{ts,tsx}',
                'src/**/*.spec.{ts,tsx}',
                'src/test/**',
                'src/workers/**',
            ],
            thresholds: {
                statements: 1.4,
                branches: 0.8,
                functions: 1,
                lines: 1.4,
            },
        },

        // Watch mode
        watch: false,

        // Reporter
        reporters: ['verbose'],

        // Timeout
        testTimeout: 10000,

        // Use single-threaded for consistent test execution
        pool: 'forks',
        isolate: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
