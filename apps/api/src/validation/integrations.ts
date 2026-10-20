/**
 * Validation schemas for task-source integration routes.
 */
import { z } from "zod";

export const integrationAccountIdParamSchema = z.object({
  id: z.string().uuid("Invalid account id"),
});

export const linkIdParamSchema = z.object({
  linkId: z.string().uuid("Invalid link id"),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().uuid("Invalid task id"),
});

export const createIntegrationAccountSchema = z.object({
  // The task-provider registry is authoritative; the route verifies this id.
  provider: z.string().min(1).max(32),
  /**
   * Provider-specific credential object. Validated a second time by the
   * provider's own `credentialSchema` before any network call, because
   * only the provider knows which fields it needs.
   */
  credentials: z.record(z.string(), z.unknown()),
});

export const updateIntegrationAccountSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});

/**
 * A pasted task link or bare id. Which provider it belongs to is decided
 * by asking each connected provider to parse it, so nothing here needs
 * to know the URL shapes.
 */
export const importTaskSchema = z.union([
  z.object({
    reference: z.string().trim().min(1, "Paste a task link or id").max(2000),
  }),
  z.object({
    accountId: z.string().uuid("Invalid account id"),
    externalId: z.string().trim().min(1).max(255),
  }),
]);

/**
 * Attaching a reference link by hand — a Gitea pull request, a GitHub
 * issue — to an existing task. These are display-only: they never drive
 * the task's fields, which is why no account is required.
 */
export const createTaskLinkSchema = z.object({
  provider: z.string().min(1).max(32),
  externalId: z.string().min(1).max(255),
  externalUrl: z.string().url().max(2000),
  kind: z.string().min(1).max(32).default("pull_request"),
  label: z.string().max(255).optional(),
});

export const taskLinkIdParamSchema = z.object({
  taskId: z.string().uuid("Invalid task id"),
  linkId: z.string().uuid("Invalid link id"),
});

export type CreateIntegrationAccountInput = z.infer<
  typeof createIntegrationAccountSchema
>;
export type UpdateIntegrationAccountInput = z.infer<
  typeof updateIntegrationAccountSchema
>;
export type ImportTaskInput = z.infer<typeof importTaskSchema>;
export type CreateTaskLinkInput = z.infer<typeof createTaskLinkSchema>;
