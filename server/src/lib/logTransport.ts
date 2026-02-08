/**
 * Log Transport Layer
 * Sends structured log entries to external aggregation services.
 * Supports Datadog, ELK (via HTTP), and custom webhooks.
 *
 * Configure via environment variables:
 *   DATADOG_API_KEY + DATADOG_SITE  → Datadog
 *   LOG_WEBHOOK_URL                 → Custom HTTP endpoint (ELK, Loki, etc.)
 */

import { serverLogger } from '../utils/logger';

interface LogEntry {
  timestamp: string;
  level: string;
  prefix: string;
  message: string;
  data?: unknown;
}

const buffer: LogEntry[] = [];
const FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const MAX_BUFFER_SIZE = 100;

let datadogApiKey: string | undefined;
let datadogSite: string | undefined;
let webhookUrl: string | undefined;
let flushTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the log transport layer.
 */
export function initLogTransport(): void {
  datadogApiKey = process.env.DATADOG_API_KEY;
  datadogSite = process.env.DATADOG_SITE || 'datadoghq.com';
  webhookUrl = process.env.LOG_WEBHOOK_URL;

  if (!datadogApiKey && !webhookUrl) {
    serverLogger.info('Log transport: No DATADOG_API_KEY or LOG_WEBHOOK_URL set — logs go to stdout only');
    return;
  }

  flushTimer = setInterval(flushLogs, FLUSH_INTERVAL_MS);

  if (datadogApiKey) {
    serverLogger.info(`Log transport: Datadog enabled (site: ${datadogSite})`);
  }
  if (webhookUrl) {
    serverLogger.info('Log transport: Webhook enabled');
  }
}

/**
 * Queue a log entry for external dispatch.
 */
export function sendLog(entry: LogEntry): void {
  if (!datadogApiKey && !webhookUrl) return;

  buffer.push(entry);

  if (buffer.length >= MAX_BUFFER_SIZE) {
    flushLogs();
  }
}

/**
 * Flush buffered logs to external services.
 */
async function flushLogs(): Promise<void> {
  if (buffer.length === 0) return;

  const batch = buffer.splice(0, buffer.length);

  // Datadog HTTP Logs API
  if (datadogApiKey) {
    try {
      const ddLogs = batch.map((entry) => ({
        ddsource: 'nabd-server',
        ddtags: `env:${process.env.NODE_ENV || 'development'},service:nabd-api`,
        hostname: process.env.HOSTNAME || 'nabd-server',
        message: `[${entry.prefix}] ${entry.message}`,
        status: entry.level,
        timestamp: entry.timestamp,
        data: entry.data,
      }));

      await fetch(`https://http-intake.logs.${datadogSite}/api/v2/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': datadogApiKey,
        },
        body: JSON.stringify(ddLogs),
      });
    } catch (err) {
      // Don't log to avoid infinite loop — just silently fail
    }
  }

  // Custom webhook (ELK, Loki, etc.)
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: batch }),
      });
    } catch {
      // Silent fail
    }
  }
}

/**
 * Shutdown — flush remaining logs.
 */
export async function shutdownLogTransport(): Promise<void> {
  if (flushTimer) clearInterval(flushTimer);
  await flushLogs();
}
