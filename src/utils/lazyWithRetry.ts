import React from 'react';
import { appLogger } from './logger';

const isChunkLoadError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;
  const message = (error as { message?: string }).message;
  return (
    typeof message === 'string' &&
    (message.includes('Importing a module script failed') ||
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Loading chunk') ||
      message.includes('ChunkLoadError'))
  );
};

/**
 * Wraps React.lazy imports with a small retry that reloads the page once
 * when a chunk fails to load (stale cache / bad network).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends React.ComponentType<any>>(importer: () => Promise<{ default: T }>) {
  const RETRY_FLAG = '__lazy_retry__';

  return React.lazy(async () => {
    try {
      const mod = await importer();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(RETRY_FLAG);
      }
      return mod;
    } catch (error) {
      if (typeof window !== 'undefined' && isChunkLoadError(error)) {
        const alreadyRetried = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(RETRY_FLAG);
        if (!alreadyRetried) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(RETRY_FLAG, '1');
          }
          // Reload to fetch fresh HTML/chunks when the previous ones 404/failed
          appLogger.error('Force refreshing due to chunk load error:', error);
          window.location.reload();
          return new Promise(() => {
            /* keep suspense fallback until reload */
          });
        }
      }
      throw error;
    }
  });
}
