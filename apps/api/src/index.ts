/**
 * Open Sunsama API - Main Entry Point
 * 
 * A Hono-based REST API for the Open Sunsama time blocking application.
 * Supports both JWT and API key authentication.
 */

import 'dotenv/config';
import { createServer, type Server as HttpServer } from 'http';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { tasksRouter } from './routes/tasks.js';
import { subtasksRouter } from './routes/subtasks.js';
import { timeBlocksRouter } from './routes/time-blocks.js';
import { apiKeysRouter } from './routes/api-keys.js';
import { notificationsRouter } from './routes/notifications.js';
import { uploadsRouter } from './routes/uploads.js';
import { attachmentsRouter } from './routes/attachments.js';
import { pushRouter } from './routes/push.js';
import { calendarOAuthRouter } from './routes/calendar-oauth.js';
import { calendarCaldavRouter } from './routes/calendar-caldav.js';
import { calendarAccountsRouter } from './routes/calendar-accounts.js';
import { calendarsRouter } from './routes/calendars.js';
import { calendarEventsRouter } from './routes/calendar-events.js';
import { releasesRouter } from './routes/releases.js';
import { registerAllWorkers } from './workers/index.js';
import { stopPgBoss, isPgBossRunning, getPgBoss, JOBS, getPgBossInitError } from './lib/pgboss.js';
import { initWebSocket, initRedisSubscriber } from './lib/websocket/index.js';
import { closeRedisConnections } from './lib/redis.js';

// Create Hono app
const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  maxAge: 86400,
  credentials: true,
}));

// Health check endpoint with PG Boss stats
// Returns unhealthy status if PG Boss is dead (triggers Railway restart)
app.get('/health', async (c) => {
  const pgBossRunning = isPgBossRunning();
  
  // Determine overall health status
  // If PG Boss should be running but isn't, mark as degraded
  const pgBossRequired = process.env.ROLLOVER_ENABLED !== 'false';
  const isHealthy = !pgBossRequired || pgBossRunning;
  
  const healthData: Record<string, unknown> = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
  };

  // Add PG Boss job queue stats if running
  if (pgBossRunning) {
    try {
      const boss = await getPgBoss();
      const pendingRolloverBatches = await boss.getQueueSize(JOBS.USER_BATCH_ROLLOVER);
      healthData.jobs = {
        pgBossRunning: true,
        pendingRolloverBatches,
      };
    } catch {
      healthData.jobs = {
        pgBossRunning: true,
        error: 'Failed to get queue stats',
      };
    }
  } else {
    const initError = getPgBossInitError();
    healthData.jobs = {
      pgBossRunning: false,
      initializationError: initError?.message || 'PG Boss not started (no error captured)',
      databaseUrlSet: !!process.env.DATABASE_URL,
    };
  }

  // Return 503 Service Unavailable if degraded (triggers Railway restart after health check failures)
  if (!isHealthy) {
    return c.json(healthData, 503);
  }

  return c.json(healthData);
});

// API info endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Open Sunsama API',
    version: process.env.npm_package_version || '0.0.0',
    docs: '/docs',
    health: '/health',
    endpoints: {
      auth: '/auth',
      tasks: '/tasks',
      subtasks: '/tasks/:taskId/subtasks',
      timeBlocks: '/time-blocks',
      apiKeys: '/api-keys',
      notifications: '/notifications',
      uploads: '/uploads',
      attachments: '/attachments',
      push: '/push',
      calendarOAuth: '/calendar/oauth',
      calendarCaldav: '/calendar/caldav',
      calendarAccounts: '/calendar/accounts',
      calendars: '/calendars',
      calendarEvents: '/calendar-events',
      releases: '/releases',
    },
  });
});

// Mount routes
app.route('/auth', authRouter);
app.route('/tasks', tasksRouter);
app.route('/tasks', subtasksRouter);  // Subtask routes under /tasks/:taskId/subtasks
app.route('/time-blocks', timeBlocksRouter);
app.route('/api-keys', apiKeysRouter);
app.route('/notifications', notificationsRouter);
app.route('/uploads', uploadsRouter);
app.route('/attachments', attachmentsRouter);
app.route('/push', pushRouter);
app.route('/calendar/oauth', calendarOAuthRouter);
app.route('/calendar/caldav', calendarCaldavRouter);
app.route('/calendar/accounts', calendarAccountsRouter);
app.route('/calendars', calendarsRouter);
app.route('/calendar-events', calendarEventsRouter);
app.route('/releases', releasesRouter);

// Error handling
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Start server
const port = parseInt(process.env.PORT || '3001', 10);

// Reference to HTTP server for graceful shutdown
let httpServer: HttpServer | null = null;

/**
 * Initialize and start the server
 */
async function startServer(): Promise<void> {
  // Initialize PG Boss and register workers
  try {
    console.log('[Server] Starting worker registration...');
    console.log('[Server] DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.log('[Server] ROLLOVER_ENABLED:', process.env.ROLLOVER_ENABLED !== 'false' ? 'true' : 'false');
    await registerAllWorkers();
    console.log('[Server] Worker registration complete');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[Server] Failed to initialize workers:', errorMessage);
    if (errorStack) {
      console.error('[Server] Stack trace:', errorStack);
    }
    // Continue starting the server even if workers fail
    // This allows the API to function without background jobs
  }

  // Create HTTP server from Hono app
  httpServer = createServer(async (req, res) => {
    // Convert Node.js IncomingHttpHeaders to a plain object for Request
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    }

    const response = await app.fetch(
      new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
        duplex: 'half',
      } as RequestInit)
    );

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(value);
        await pump();
      };
      await pump();
    } else {
      res.end();
    }
  });

  // Initialize WebSocket server
  // Redis is optional - without it, events are broadcast directly (single-server mode)
  const redisConfigured = !!process.env.REDIS_URL;
  let redisEnabled = false;
  
  if (redisConfigured) {
    redisEnabled = initRedisSubscriber();
  }
  
  // Always initialize WebSocket server
  initWebSocket(httpServer);
  
  const wsMode = redisEnabled ? 'Redis pub/sub' : 'direct broadcast (local dev)';
  console.log(`[WS] WebSocket enabled with ${wsMode}`);

  // Start listening
  httpServer.listen(port, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   Open Sunsama API                                        ║
  ║                                                           ║
  ║   Server running at http://localhost:${port}                 ║
  ║                                                           ║
  ║   Endpoints:                                              ║
   ║   - GET  /           API info                             ║
   ║   - GET  /health     Health check                         ║
   ║   - POST /auth/*     Authentication                       ║
   ║   - *    /tasks/*    Task management                      ║
   ║   - *    /time-blocks/*  Time block management            ║
   ║   - *    /api-keys/* API key management                   ║
   ║   - *    /notifications/* Notification settings           ║
   ║   - *    /uploads/*  File uploads                         ║
   ║   - *    /attachments/* Attachment management             ║
   ║   - *    /push/*    Push notifications                    ║
   ║   - *    /calendar/* Calendar integration                 ║
   ║   - *    /calendars  Calendar settings                    ║
   ║   - *    /calendar-events Calendar events                 ║
   ║   - *    /releases/*  Desktop releases                    ║
  ║                                                           ║
  ║   Background Jobs:                                        ║
  ║   - Task Rollover (${process.env.ROLLOVER_ENABLED !== 'false' ? 'enabled' : 'disabled'})                           ║
  ║                                                           ║
  ║   WebSocket:                                              ║
  ║   - Enabled at /ws (${redisEnabled ? 'Redis' : 'direct'})                        ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
`);
  });
}

// Graceful shutdown handlers
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
  
  try {
    // Close HTTP server (stops accepting new connections)
    if (httpServer) {
      httpServer.close();
    }

    // Stop background job processor
    await stopPgBoss();

    // Close Redis connections
    await closeRedisConnections();

    console.log('[Server] Cleanup complete');
  } catch (error) {
    console.error('[Server] Error during shutdown:', error);
  }
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer().catch((error) => {
  console.error('[Server] Failed to start:', error);
  process.exit(1);
});

export default app;
export type AppType = typeof app;
