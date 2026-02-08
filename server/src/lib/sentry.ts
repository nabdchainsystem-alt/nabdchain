/**
 * Sentry Error Tracking
 * Initializes Sentry for production error monitoring.
 * Set SENTRY_DSN environment variable to enable.
 */
import * as Sentry from '@sentry/node';
import express from 'express';
import { serverLogger } from '../utils/logger';

let initialized = false;

export function initSentry(app: express.Application): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    serverLogger.info('Sentry: SENTRY_DSN not set — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || `nabd@${process.env.npm_package_version || 'unknown'}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
    integrations: [
      Sentry.expressIntegration(),
    ],
    beforeSend(event) {
      // Strip sensitive data from error reports
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      return event;
    },
  });

  initialized = true;
  serverLogger.info('Sentry: Error tracking initialized');
}

/**
 * Sentry error handler middleware — mount after all routes.
 */
export function sentryErrorHandler() {
  if (!initialized) {
    return (_err: Error, _req: express.Request, _res: express.Response, next: express.NextFunction) => next(_err);
  }
  return Sentry.expressErrorHandler();
}

/**
 * Capture an exception manually.
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (initialized) {
    Sentry.captureException(error, { extra: context });
  }
}

/**
 * Capture a message manually.
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (initialized) {
    Sentry.captureMessage(message, level);
  }
}
