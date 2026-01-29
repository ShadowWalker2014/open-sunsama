/**
 * Attachments routes for Open Sunsama API
 * Handles listing, fetching, and deleting file attachments
 */

import { Hono } from 'hono';
import { getDb, attachments, eq, and } from '@open-sunsama/database';
import { NotFoundError } from '@open-sunsama/utils';
import { auth, type AuthVariables } from '../middleware/auth.js';
import { deleteFromS3 } from '../lib/s3.js';

const attachmentsRouter = new Hono<{ Variables: AuthVariables }>();

/**
 * GET /attachments - List attachments
 * Optionally filtered by taskId query parameter
 * Requires authentication
 */
attachmentsRouter.get('/', auth, async (c) => {
  const userId = c.get('userId');
  const taskId = c.req.query('taskId');
  const db = getDb();

  let results;
  if (taskId) {
    results = await db
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.userId, userId),
          eq(attachments.taskId, taskId)
        )
      );
  } else {
    results = await db
      .select()
      .from(attachments)
      .where(eq(attachments.userId, userId));
  }

  return c.json({ success: true, data: results });
});

/**
 * GET /attachments/:id - Get a single attachment by ID
 * Requires authentication
 */
attachmentsRouter.get('/:id', auth, async (c) => {
  const userId = c.get('userId');
  const attachmentId = c.req.param('id');
  const db = getDb();

  const [attachment] = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.id, attachmentId),
        eq(attachments.userId, userId)
      )
    )
    .limit(1);

  if (!attachment) {
    throw new NotFoundError('Attachment', attachmentId);
  }

  return c.json({ success: true, data: attachment });
});

/**
 * DELETE /attachments/:id - Delete an attachment
 * Deletes both from S3 and from the database
 * Requires authentication
 */
attachmentsRouter.delete('/:id', auth, async (c) => {
  const userId = c.get('userId');
  const attachmentId = c.req.param('id');
  const db = getDb();

  // Find the attachment first to verify ownership and get s3Key
  const [attachment] = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.id, attachmentId),
        eq(attachments.userId, userId)
      )
    )
    .limit(1);

  if (!attachment) {
    throw new NotFoundError('Attachment', attachmentId);
  }

  // Delete from S3
  await deleteFromS3(attachment.s3Key);

  // Delete from database
  await db.delete(attachments).where(eq(attachments.id, attachmentId));

  return c.json({ success: true, message: 'Attachment deleted successfully' });
});

export { attachmentsRouter };
