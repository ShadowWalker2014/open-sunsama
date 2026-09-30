/**
 * Task-source integration routes.
 *
 * Connect / list / disconnect accounts, import one external task from a
 * pasted reference, refresh an imported task, and attach reference links
 * to a task by hand.
 *
 * Credentials never leave the API — account responses carry
 * `hasCredentials: true` and nothing else.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getDb,
  eq,
  and,
  desc,
  integrationAccounts,
  taskExternalLinks,
  tasks,
} from "@open-sunsama/database";
import { NotFoundError } from "@open-sunsama/utils";
import { auth, requireScopes, type AuthVariables } from "../middleware/auth.js";
import {
  createIntegrationAccountSchema,
  createTaskLinkSchema,
  importTaskSchema,
  integrationAccountIdParamSchema,
  linkIdParamSchema,
  taskIdParamSchema,
  taskLinkIdParamSchema,
  updateIntegrationAccountSchema,
} from "../validation/integrations.js";
import {
  getTaskProvider,
  hasTaskProvider,
  listTaskProviders,
  ProviderCredentialError,
  ProviderRateLimitError,
  ProviderTaskNotFoundError,
} from "../services/task-providers/index.js";
import {
  importExternalTask,
  refreshLinkedTask,
  resolveReference,
} from "../services/task-import.js";
import { encrypt } from "../services/encryption.js";
import { publishEvent } from "../lib/websocket/index.js";
import type { IntegrationAccount } from "@open-sunsama/database/schema";

const integrationsRouter = new Hono<{ Variables: AuthVariables }>();
integrationsRouter.use("*", auth);

/** Strip credentials before an account row ever reaches a client. */
function toPublicAccount(account: IntegrationAccount) {
  const { credentialsEncrypted, ...rest } = account;
  return { ...rest, hasCredentials: Boolean(credentialsEncrypted) };
}

/**
 * Map a provider failure onto an HTTP response. Shared by import and
 * refresh so the same cause reads the same way wherever it surfaces.
 */
function providerErrorResponse(error: unknown) {
  if (error instanceof ProviderCredentialError) {
    // 401 means the *Open Sunsama* session expired to our API client.
    return { status: 422 as const, code: error.code, message: error.message };
  }
  if (error instanceof ProviderTaskNotFoundError) {
    return { status: 404 as const, code: error.code, message: error.message };
  }
  if (error instanceof ProviderRateLimitError) {
    return { status: 429 as const, code: error.code, message: error.message };
  }
  return null;
}

/**
 * GET /integrations/providers
 * Static registry of what can be connected, which fields the connect
 * dialog renders, and an example reference for the import dialog.
 */
integrationsRouter.get(
  "/providers",
  requireScopes("integrations:read"),
  (c) => {
    return c.json({
      success: true,
      data: listTaskProviders().map((provider) => ({
        id: provider.id,
        displayName: provider.displayName,
        docsUrl: provider.docsUrl,
        credentialFields: provider.credentialFields,
        referenceExample: provider.referenceExample,
      })),
    });
  }
);

/**
 * GET /integrations/accounts
 */
integrationsRouter.get(
  "/accounts",
  requireScopes("integrations:read"),
  async (c) => {
    const userId = c.get("userId");
    const db = getDb();

    const accounts = await db
      .select()
      .from(integrationAccounts)
      .where(eq(integrationAccounts.userId, userId))
      .orderBy(desc(integrationAccounts.createdAt));

    return c.json({ success: true, data: accounts.map(toPublicAccount) });
  }
);

/**
 * POST /integrations/accounts
 * Connect a task source.
 *
 * The credential is verified against the live provider before anything
 * is stored, so a mistyped token fails here with a clear message rather
 * than on the user's first import.
 */
integrationsRouter.post(
  "/accounts",
  requireScopes("integrations:write"),
  zValidator("json", createIntegrationAccountSchema),
  async (c) => {
    const userId = c.get("userId");
    const { provider: providerId, credentials } = c.req.valid("json");
    const db = getDb();

    if (!hasTaskProvider(providerId)) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_PROVIDER",
            message: `Unknown task provider: ${providerId}`,
          },
        },
        400
      );
    }

    const provider = getTaskProvider(providerId);

    const parsed = provider.credentialSchema.safeParse(credentials);
    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: parsed.error.issues[0]?.message ?? "Invalid credentials",
          },
        },
        400
      );
    }

    let verified;
    try {
      verified = await provider.verifyCredentials(parsed.data);
    } catch (error) {
      const mapped = providerErrorResponse(error);
      if (mapped) {
        return c.json(
          { success: false, error: { code: mapped.code, message: mapped.message } },
          mapped.status
        );
      }
      throw error;
    }

    const credentialsEncrypted = encrypt(JSON.stringify(verified.credentials));

    // Reconnecting the same provider account refreshes the existing row
    // rather than creating a second one.
    const [existing] = await db
      .select()
      .from(integrationAccounts)
      .where(
        and(
          eq(integrationAccounts.userId, userId),
          eq(integrationAccounts.provider, providerId),
          eq(integrationAccounts.providerAccountId, verified.providerAccountId)
        )
      )
      .limit(1);

    const values = {
      label: verified.label,
      credentialsEncrypted,
      isActive: true,
      updatedAt: new Date(),
    };

    const [account] = existing
      ? await db
          .update(integrationAccounts)
          .set(values)
          .where(eq(integrationAccounts.id, existing.id))
          .returning()
      : await db
          .insert(integrationAccounts)
          .values({
            userId,
            provider: providerId,
            providerAccountId: verified.providerAccountId,
            ...values,
          })
          .returning();

    if (!account) {
      throw new Error("Failed to save integration account");
    }

    publishEvent(userId, "integration:account-connected", {
      accountId: account.id,
      provider: providerId,
    });

    return c.json({ success: true, data: toPublicAccount(account) }, 201);
  }
);

/**
 * PATCH /integrations/accounts/:id
 */
integrationsRouter.patch(
  "/accounts/:id",
  requireScopes("integrations:write"),
  zValidator("param", integrationAccountIdParamSchema),
  zValidator("json", updateIntegrationAccountSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const patch = c.req.valid("json");
    const db = getDb();

    const [account] = await db
      .update(integrationAccounts)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(integrationAccounts.id, id),
          eq(integrationAccounts.userId, userId)
        )
      )
      .returning();

    if (!account) {
      throw new NotFoundError("Integration account not found");
    }

    return c.json({ success: true, data: toPublicAccount(account) });
  }
);

/**
 * DELETE /integrations/accounts/:id
 *
 * Disconnects the source but keeps every task it imported. The links
 * survive too (with `account_id` nulled by the FK) so a card can still
 * show where the task came from and deep-link to it.
 */
integrationsRouter.delete(
  "/accounts/:id",
  requireScopes("integrations:write"),
  zValidator("param", integrationAccountIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { id } = c.req.valid("param");
    const db = getDb();

    const [account] = await db
      .select()
      .from(integrationAccounts)
      .where(
        and(
          eq(integrationAccounts.id, id),
          eq(integrationAccounts.userId, userId)
        )
      )
      .limit(1);

    if (!account) {
      throw new NotFoundError("Integration account not found");
    }

    // Orphan the links first. Without this they keep `status = 'active'`
    // while nothing can refresh them, which reads as a live connection.
    await db
      .update(taskExternalLinks)
      .set({ status: "orphaned", updatedAt: new Date() })
      .where(eq(taskExternalLinks.accountId, id));

    await db.delete(integrationAccounts).where(eq(integrationAccounts.id, id));

    publishEvent(userId, "integration:account-disconnected", {
      accountId: id,
      provider: account.provider,
    });

    return c.json({ success: true, data: { id } });
  }
);

/**
 * POST /integrations/import
 * Import one task from a pasted link or id.
 *
 * The provider is inferred from the reference itself, so the user never
 * has to say which tool the link came from.
 */
integrationsRouter.post(
  "/import",
  requireScopes("integrations:write"),
  zValidator("json", importTaskSchema),
  async (c) => {
    const userId = c.get("userId");
    const { reference } = c.req.valid("json");

    const resolved = await resolveReference(userId, reference);
    if (!resolved) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNRECOGNIZED_REFERENCE",
            message:
              "That doesn't look like a task link or id from any connected source. Check the link, or connect the integration first.",
          },
        },
        400
      );
    }

    try {
      const result = await importExternalTask(
        userId,
        resolved.account,
        resolved.externalId
      );

      if (!result.alreadyExisted) {
        publishEvent(userId, "task:created", {
          taskId: result.task.id,
          scheduledDate: result.task.scheduledDate,
        });
      }

      return c.json(
        {
          success: true,
          data: {
            task: result.task,
            link: result.link,
            alreadyExisted: result.alreadyExisted,
          },
        },
        result.alreadyExisted ? 200 : 201
      );
    } catch (error) {
      const mapped = providerErrorResponse(error);
      if (mapped) {
        return c.json(
          { success: false, error: { code: mapped.code, message: mapped.message } },
          mapped.status
        );
      }
      throw error;
    }
  }
);

/**
 * POST /integrations/links/:linkId/refresh
 * Pull the linked task's current values from the provider.
 */
integrationsRouter.post(
  "/links/:linkId/refresh",
  requireScopes("integrations:write"),
  zValidator("param", linkIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { linkId } = c.req.valid("param");

    try {
      const { task, link } = await refreshLinkedTask(userId, linkId);
      publishEvent(userId, "task:updated", { taskId: task.id });
      return c.json({ success: true, data: { task, link } });
    } catch (error) {
      const mapped = providerErrorResponse(error);
      if (mapped) {
        return c.json(
          { success: false, error: { code: mapped.code, message: mapped.message } },
          mapped.status
        );
      }
      throw error;
    }
  }
);

/**
 * GET /integrations/tasks/:taskId/links
 */
integrationsRouter.get(
  "/tasks/:taskId/links",
  requireScopes("integrations:read"),
  zValidator("param", taskIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { taskId } = c.req.valid("param");
    const db = getDb();

    const links = await db
      .select()
      .from(taskExternalLinks)
      .where(
        and(
          eq(taskExternalLinks.taskId, taskId),
          eq(taskExternalLinks.userId, userId)
        )
      );

    return c.json({ success: true, data: links });
  }
);

/**
 * POST /integrations/tasks/:taskId/links
 * Attach a reference link — a Gitea pull request, a GitHub issue — to a
 * task by hand. Always `role: 'reference'`: it is display only and never
 * writes to the task's fields.
 */
integrationsRouter.post(
  "/tasks/:taskId/links",
  requireScopes("integrations:write"),
  zValidator("param", taskIdParamSchema),
  zValidator("json", createTaskLinkSchema),
  async (c) => {
    const userId = c.get("userId");
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    const db = getDb();

    const [task] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    const [link] = await db
      .insert(taskExternalLinks)
      .values({
        userId,
        taskId,
        accountId: null,
        provider: body.provider,
        externalId: body.externalId,
        externalUrl: body.externalUrl,
        kind: body.kind,
        role: "reference",
        status: "active",
        remoteMeta: body.label ? { containerName: body.label } : null,
      })
      .returning();

    publishEvent(userId, "task:updated", { taskId });
    return c.json({ success: true, data: link }, 201);
  }
);

/**
 * DELETE /integrations/tasks/:taskId/links/:linkId
 *
 * Detaching the source link leaves the task in place as an ordinary
 * local task — it just stops being refreshable.
 */
integrationsRouter.delete(
  "/tasks/:taskId/links/:linkId",
  requireScopes("integrations:write"),
  zValidator("param", taskLinkIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { taskId, linkId } = c.req.valid("param");
    const db = getDb();

    const [link] = await db
      .select()
      .from(taskExternalLinks)
      .where(
        and(
          eq(taskExternalLinks.id, linkId),
          eq(taskExternalLinks.taskId, taskId),
          eq(taskExternalLinks.userId, userId)
        )
      )
      .limit(1);

    if (!link) {
      throw new NotFoundError("Link not found");
    }

    await db.delete(taskExternalLinks).where(eq(taskExternalLinks.id, linkId));

    publishEvent(userId, "task:updated", { taskId });
    return c.json({ success: true, data: { id: linkId } });
  }
);

export { integrationsRouter };
export default integrationsRouter;
