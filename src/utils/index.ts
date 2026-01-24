/**
 * Utility functions index
 * Re-exports all utilities for convenient importing
 */

export * from './storage';
export * from './logger';
export * from './lazyWithRetry';
export * from './formatters';
// Note: dashboardHelpers has phosphor-react imports - import directly where needed
// export * from './dashboardHelpers';
export * from './sanitize';

// Browser-only utilities - import directly where needed, not from barrel:
// - performance
// - serviceWorker
// - prefetch
// - errorTracking
// - accessibility
// - webVitals
// - offlineQueue
