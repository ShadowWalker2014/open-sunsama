/**
 * Release routes for Open Sunsama API
 * Handles release version management for desktop app updates
 * 
 * Public routes (no auth):
 * - GET /releases - List all releases
 * - GET /releases/latest - Get latest version for each platform
 * - GET /releases/update/:target/:current_version - Tauri updater endpoint
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
  tauriUpdateParamSchema,
  TAURI_TARGET_MAP,
  TAURI_OS_TARGETS,
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

/** Compare two x.y.z versions: negative if a < b, 0 if equal, positive if a > b. */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * GET /releases/update/:target/:current_version - Tauri updater endpoint
 * Returns 204 if no update is available.
 *
 * Installed apps send the OS alone as `target` (darwin, linux, windows); for those we return
 * Tauri's static format with a `platforms` entry per architecture so the app can pick its own.
 * A full `{os}-{arch}` target gets the single-platform dynamic format.
 */
releasesRouter.get('/update/:target/:current_version', zValidator('param', tauriUpdateParamSchema), async (c) => {
  const { target, current_version } = c.req.valid('param');
  const tauriTargets = TAURI_OS_TARGETS[target] ?? [target];
  const db = getDb();

  const latest = (
    await Promise.all(
      tauriTargets.map(async (tauriTarget) => {
        const platform = TAURI_TARGET_MAP[tauriTarget];
        if (!platform) return null;
        const [release] = await db
          .select()
          .from(releases)
          .where(eq(releases.platform, platform))
          .orderBy(desc(releases.createdAt))
          .limit(1);
        return release ? { tauriTarget, release } : null;
      })
    )
  ).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const newestVersion = latest
    .map(({ release }) => release.version)
    .sort(compareVersions)
    .pop();

  if (!newestVersion || compareVersions(newestVersion, current_version) <= 0) {
    return c.body(null, 204);
  }

  // Only offer builds that are actually at the newest version, so an architecture whose
  // build failed never installs an older binary labelled as the new version.
  const current = latest.filter(({ release }) => release.version === newestVersion);
  const [first] = current;
  const updateFields = (release: (typeof current)[number]['release']) => ({
    // Use updaterUrl (tar.gz / setup.exe / AppImage) for Tauri, falling back to downloadUrl
    url: release.updaterUrl || release.downloadUrl,
    signature: release.signature || '',
  });
  const meta = {
    version: newestVersion,
    pub_date: first!.release.createdAt.toISOString(),
    notes: first!.release.releaseNotes || `Update to version ${newestVersion}`,
  };

  if (TAURI_OS_TARGETS[target]) {
    return c.json({
      ...meta,
      platforms: Object.fromEntries(
        current.map(({ tauriTarget, release }) => [tauriTarget, updateFields(release)])
      ),
    });
  }

  return c.json({ ...meta, ...updateFields(first!.release) });
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

/** POST /releases - Create or update a release (upsert) */
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
    // Upsert: update existing release with new data
    const [updated] = await db
      .update(releases)
      .set({
        downloadUrl: data.downloadUrl,
        fileSize: data.fileSize,
        fileName: data.fileName,
        sha256: data.sha256 ?? null,
        signature: data.signature ?? null,
        updaterUrl: data.updaterUrl ?? null,
        releaseNotes: data.releaseNotes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(releases.id, existing.id))
      .returning();

    return c.json({ success: true, data: updated });
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
      signature: data.signature ?? null,
      updaterUrl: data.updaterUrl ?? null,
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
