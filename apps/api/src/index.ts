/**
 * Open Sunsama API - Main Entry Point
 * 
 * A Hono-based REST API for the Open Sunsama time blocking application.
 * Supports both JWT and API key authentication.
 */

import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';

import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { tasksRouter } from './routes/tasks.js';
import { subtasksRouter } from './routes/subtasks.js';
import { timeBlocksRouter } from './routes/time-blocks.js';
import { apiKeysRouter } from './routes/api-keys.js';
import { notificationsRouter } from './routes/notifications.js';
import { uploadsRouter } from './routes/uploads.js';
import { attachmentsRouter } from './routes/attachments.js';

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

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
  });
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

// Error handling
app.onError(errorHandler);
app.notFound(notFoundHandler);

// Start server
const port = parseInt(process.env.PORT || '3001', 10);

console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   ⏰  Open Sunsama API                                     ║
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
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
export type AppType = typeof app;
