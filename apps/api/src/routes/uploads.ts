/**
 * Upload routes for Open Sunsama API
 * Handles file uploads and serves files from S3 via proxy
 */

import { Hono } from 'hono';
import { getDb, eq, users, attachments } from '@open-sunsama/database';
import { ValidationError, NotFoundError } from '@open-sunsama/utils';
import { auth, type AuthVariables } from '../middleware/auth.js';
import {
  uploadToS3,
  getS3Object,
  deleteFromS3,
  generateUniqueKey,
} from '../lib/s3.js';
import {
  MAX_AVATAR_SIZE,
  MAX_ATTACHMENT_SIZE,
  ALLOWED_AVATAR_TYPES,
  isAllowedAvatarType,
  isAllowedAttachmentType,
} from '../validation/uploads.js';

const uploadsRouter = new Hono<{ Variables: AuthVariables }>();

/**
 * POST /uploads/avatar - Upload a user avatar
 * Requires authentication
 * Accepts multipart form data with "file" field
 * Max size: 2MB, allowed types: image/*
 */
uploadsRouter.post('/avatar', auth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.parseBody();

  const file = body['file'];

  // Validate file presence
  if (!file || !(file instanceof File)) {
    throw new ValidationError('No file provided', {
      file: ['File is required'],
    });
  }

  // Validate file type
  if (!isAllowedAvatarType(file.type)) {
    throw new ValidationError('Invalid file type', {
      file: [
        `Invalid file type '${file.type}'. Allowed types: ${ALLOWED_AVATAR_TYPES.join(', ')}`,
      ],
    });
  }

  // Validate file size
  if (file.size > MAX_AVATAR_SIZE) {
    throw new ValidationError('File too large', {
      file: [
        `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (${MAX_AVATAR_SIZE / (1024 * 1024)}MB)`,
      ],
    });
  }

  // Generate unique key and upload to S3
  const key = generateUniqueKey(userId, 'avatars', file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToS3(key, buffer, file.type);

  // Update user's avatar URL in database
  const db = getDb();
  await db
    .update(users)
    .set({ avatarUrl: url, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return c.json({
    success: true,
    data: { url },
  });
});

/**
 * POST /uploads/attachments - Upload a file attachment
 * Requires authentication
 * Accepts multipart form data with "file" field and optional "taskId"
 * Max size: 10MB, allowed types: images, videos, documents
 */
uploadsRouter.post('/attachments', auth, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.parseBody();

  const file = body['file'];
  const taskId = body['taskId'];

  // Validate file presence
  if (!file || !(file instanceof File)) {
    throw new ValidationError('No file provided', {
      file: ['File is required'],
    });
  }

  // Validate file type
  if (!isAllowedAttachmentType(file.type)) {
    throw new ValidationError('Invalid file type', {
      file: [
        `Invalid file type '${file.type}'. Allowed types: images (jpeg, png, gif, webp), videos (mp4, webm, mov), documents (pdf, doc, docx, xls, xlsx, txt)`,
      ],
    });
  }

  // Validate file size
  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new ValidationError('File too large', {
      file: [
        `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB)`,
      ],
    });
  }

  // Validate taskId if provided
  if (taskId && typeof taskId === 'string') {
    // UUID validation regex
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(taskId)) {
      throw new ValidationError('Invalid taskId', {
        taskId: ['taskId must be a valid UUID'],
      });
    }
  }

  // Generate unique key and upload to S3
  const key = generateUniqueKey(userId, 'attachments', file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToS3(key, buffer, file.type);

  // Save attachment metadata to database
  const db = getDb();
  const [attachment] = await db.insert(attachments).values({
    taskId: typeof taskId === 'string' ? taskId : null,
    userId,
    url,
    filename: file.name,
    contentType: file.type,
    size: file.size,
    s3Key: key,
  }).returning();

  return c.json({
    success: true,
    data: attachment,
  });
});

/**
 * GET /uploads/* - Proxy endpoint to serve files from S3
 * Railway buckets are private, so we proxy requests through this endpoint
 * Supports caching headers for immutable content
 */
uploadsRouter.get('/*', async (c) => {
  // Extract the key from the path (everything after /uploads/)
  const path = c.req.path;
  const key = path.replace(/^\/uploads\//, '');

  if (!key) {
    throw new NotFoundError('File');
  }

  // Fetch from S3
  const result = await getS3Object(key);

  if (!result) {
    throw new NotFoundError('File', key);
  }

  // Stream the file back with proper headers
  return new Response(result.body, {
    headers: {
      'Content-Type': result.contentType,
      'Content-Length': result.contentLength.toString(),
      // Cache immutable content for 1 year (files have unique timestamps in keys)
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

/**
 * DELETE /uploads/* - Delete a file from S3
 * Requires authentication
 * Only allows deleting files that belong to the authenticated user
 */
uploadsRouter.delete('/*', auth, async (c) => {
  const userId = c.get('userId');
  const path = c.req.path;
  const key = path.replace(/^\/uploads\//, '');

  if (!key) {
    throw new NotFoundError('File');
  }

  // Verify the file belongs to the user by checking the key format
  // Keys are in format: {folder}/{userId}/{timestamp}-{filename}
  const keyParts = key.split('/');
  if (keyParts.length < 3) {
    throw new NotFoundError('File', key);
  }

  const fileUserId = keyParts[1];
  if (fileUserId !== userId) {
    throw new NotFoundError('File', key);
  }

  // Delete from S3
  await deleteFromS3(key);

  return c.json({
    success: true,
    message: 'File deleted successfully',
  });
});

export { uploadsRouter };
