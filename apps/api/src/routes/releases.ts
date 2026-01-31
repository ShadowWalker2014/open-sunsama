/**
 * Release routes for Open Sunsama API
 * Handles release version management for desktop app updates
 * 
 * Public routes (no auth):
 * - GET /releases - List all releases
 * - GET /releases/latest - Get latest version for each platform
 * - GET /releases/:platform - Get latest for specific platform
 * 
 * Protected routes:
 * - POST /releases - Create a new release (requires RELEASE_SECRET)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { nanoid } from 'nanoid';
import { getDb, eq, desc, releases, sql, RELEASE_PLATFORMS } from '@open-sunsama/database';
import { AuthenticationError, ValidationError } from '@open-sunsama/utils';
import {
  createReleaseSchema,
  releaseFilterSchema,
  platformParamSchema,
} from '../validation/releases.js';

const releasesRouter = new Hono();

/**
 * Verify release secret for protected routes
 * Checks X-Release-Secret header against RELEASE_SECRET env var
 */
async function verifyReleaseAuth(c: { req: { header: (name: string) => string | undefined } }): Promise<void> {
  const releaseSecret = c.req.header('X-Release-Secret');
  const expectedSecret = process.env.RELEASE_SECRET;

  // Check release secret
  if (releaseSecret && expectedSecret && releaseSecret === expectedSecret) {
    return;
  }

  // If no release secret or invalid, throw error
  if (!releaseSecret) {
    throw new AuthenticationError('X-Release-Secret header required');
  }

  throw new AuthenticationError('Invalid release secret');
}

/** GET /releases - List all releases with pagination */
releasesRouter.get('/', zValidator('query', releaseFilterSchema), async (c) => {
  const filters = c.req.valid('query');
  const db = getDb();

  const offset = (filters.page - 1) * filters.limit;

  // Build where clause
  const whereClause = filters.platform ? eq(releases.platform, filters.platform) : undefined;

  // Get total count
  const countQuery = whereClause
    ? db.select({ count: sql<number>`count(*)::int` }).from(releases).where(whereClause)
    : db.select({ count: sql<number>`count(*)::int` }).from(releases);
  
  const [countResult] = await countQuery;
  const total = countResult?.count || 0;

  // Get paginated results
  const resultsQuery = whereClause
    ? db.select().from(releases).where(whereClause).orderBy(desc(releases.createdAt)).limit(filters.limit).offset(offset)
    : db.select().from(releases).orderBy(desc(releases.createdAt)).limit(filters.limit).offset(offset);

  const results = await resultsQuery;

  return c.json({
    success: true,
    data: results,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  });
});

/** GET /releases/latest - Get latest version for each platform */
releasesRouter.get('/latest', async (c) => {
  const db = getDb();

  // Get the latest release for each platform
  const latestReleases = await Promise.all(
    RELEASE_PLATFORMS.map(async (platform) => {
      const [release] = await db
        .select()
        .from(releases)
        .where(eq(releases.platform, platform))
        .orderBy(desc(releases.createdAt))
        .limit(1);
      return release;
    })
  );

  // Convert to a map by platform for easier client consumption
  const byPlatform: Record<string, (typeof latestReleases)[0]> = {};
  for (const release of latestReleases) {
    if (release) {
      byPlatform[release.platform] = release;
    }
  }

  return c.json({
    success: true,
    data: byPlatform,
  });
});

/** GET /releases/:platform - Get latest release for specific platform */
releasesRouter.get('/:platform', zValidator('param', platformParamSchema), async (c) => {
  const { platform } = c.req.valid('param');
  const db = getDb();

  const [latestRelease] = await db
    .select()
    .from(releases)
    .where(eq(releases.platform, platform))
    .orderBy(desc(releases.createdAt))
    .limit(1);

  if (!latestRelease) {
    return c.json({
      success: true,
      data: null,
      message: `No releases found for platform: ${platform}`,
    });
  }

  return c.json({
    success: true,
    data: latestRelease,
  });
});

/** POST /releases - Create a new release */
releasesRouter.post('/', zValidator('json', createReleaseSchema), async (c) => {
  // Verify release secret
  await verifyReleaseAuth(c);

  const data = c.req.valid('json');
  const db = getDb();

  // Check if this version + platform combination already exists
  const [existing] = await db
    .select()
    .from(releases)
    .where(sql`${releases.version} = ${data.version} AND ${releases.platform} = ${data.platform}`)
    .limit(1);

  if (existing) {
    throw new ValidationError('Release already exists', {
      version: [`Release ${data.version} for ${data.platform} already exists`],
    });
  }

  // Generate release ID
  const id = `rel_${nanoid()}`;

  // Insert the new release
  const [newRelease] = await db
    .insert(releases)
    .values({
      id,
      version: data.version,
      platform: data.platform,
      downloadUrl: data.downloadUrl,
      fileSize: data.fileSize,
      fileName: data.fileName,
      sha256: data.sha256 ?? null,
      releaseNotes: data.releaseNotes ?? null,
    })
    .returning();

  return c.json(
    {
      success: true,
      data: newRelease,
    },
    201
  );
});

export { releasesRouter };
