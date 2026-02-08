import 'dotenv/config'; // Must be first
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { validateEnv, isProduction, getEnv } from './utils/env';
import {
  isWorkersEnabled,
  isSchedulerEnabled,
  isEventOutboxWorkerEnabled,
  isJobQueueWorkerEnabled,
  getFeatureFlags,
} from './config/runtimeFlags';
import { prisma } from './lib/prisma';
import { initializeSocket } from './socket/index';
import { portalNotificationService } from './services/portalNotificationService';
import { initializeScheduler } from './jobs/scheduler';
import { appLogger } from './services/observability';
import { initializeObservability } from './services/observability';
import { initBullMQ, shutdownBullMQ } from './lib/bullmq';
import { initLogTransport, shutdownLogTransport } from './lib/logTransport';
import { eventOutboxWorker } from './workers/eventOutboxWorker';
import { jobQueueWorker } from './workers/jobQueueWorker';
import { createApp } from './app';

// Validate environment variables at startup
validateEnv();

const app = createApp();
const PORT = parseInt(getEnv('PORT', '3001'), 10);

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Socket.io WebSocket server
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: isProduction
            ? ['https://nabdchain.com', 'https://www.nabdchain.com', 'https://app.nabdchain.com', 'https://mobile.nabdchain.com']
            : true,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Initialize socket event handlers
initializeSocket(io);

// Initialize portal notification service with Socket.IO
portalNotificationService.initialize(io);

// Log feature flags
const featureFlags = getFeatureFlags();
appLogger.info('Feature flags:', featureFlags);

// Initialize background job scheduler (cron-based) - only if enabled
if (isSchedulerEnabled()) {
    initializeScheduler();
    appLogger.info('Background job scheduler initialized');
} else {
    appLogger.info('Background job scheduler DISABLED (set ENABLE_SCHEDULER=true to enable)');
}

// Initialize background workers (database-backed queues) - only if enabled
if (isWorkersEnabled()) {
    if (isEventOutboxWorkerEnabled()) {
        eventOutboxWorker.start();
        appLogger.info('EventOutbox worker started');
    } else {
        appLogger.info('EventOutbox worker DISABLED (set ENABLE_EVENT_OUTBOX_WORKER=true to enable)');
    }

    if (isJobQueueWorkerEnabled()) {
        jobQueueWorker.start();
        appLogger.info('JobQueue worker started');
    } else {
        appLogger.info('JobQueue worker DISABLED (set ENABLE_JOB_QUEUE_WORKER=true to enable)');
    }
} else {
    appLogger.info('Background workers DISABLED (set ENABLE_WORKERS=true to enable)');
}

// Initialize observability services
initializeObservability(prisma);

// Initialize BullMQ (Redis job queue)
initBullMQ();

// Initialize log transport (Datadog/ELK/webhook)
initLogTransport();

httpServer.listen(PORT, () => {
    appLogger.info(`NABD API running on port ${PORT}`, {
        environment: isProduction ? 'production' : 'development',
        nodeVersion: process.version,
        featureFlags,
    });
    appLogger.info('WebSocket server enabled');
    appLogger.info('Observability services initialized');
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    appLogger.info(`Received ${signal}, starting graceful shutdown...`);

    httpServer.close(() => {
        appLogger.info('HTTP server closed');
    });

    if (isWorkersEnabled()) {
        try {
            const stopPromises: Promise<void>[] = [];
            if (isJobQueueWorkerEnabled()) {
                stopPromises.push(jobQueueWorker.stop());
            }
            if (isEventOutboxWorkerEnabled()) {
                stopPromises.push(eventOutboxWorker.stop());
            }
            if (stopPromises.length > 0) {
                await Promise.all(stopPromises);
                appLogger.info('Background workers stopped');
            }
        } catch (error) {
            appLogger.error('Error stopping workers:', error);
        }
    }

    try {
        await shutdownBullMQ();
        await shutdownLogTransport();
    } catch (error) {
        appLogger.error('Error stopping BullMQ/log transport:', error);
    }

    try {
        await prisma.$disconnect();
        appLogger.info('Database connection closed');
    } catch (error) {
        appLogger.error('Error disconnecting database:', error);
    }

    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
