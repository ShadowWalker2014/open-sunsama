/**
 * Task-source provider contract.
 *
 * Providers supply *work* — a task, an issue, a pull request — that the
 * user pulls in one item at a time by pasting a link or an id. There is
 * no background sync and nothing is ever written back upstream: a
 * provider only has to recognize a reference and fetch it.
 */
import type { z } from "zod";
import type { TaskPriority } from "@open-sunsama/database";
import { NotFoundError } from "@open-sunsama/utils";

export interface ExternalSubtask {
  externalId: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface ExternalTask {
  externalId: string;
  title: string;
  description: string | null;
  /** Already mapped to the local P0–P3 scale. Null means "not set upstream". */
  priority: TaskPriority | null;
  estimatedMins: number | null;
  isCompleted: boolean;
  /** Remote status label for display, e.g. "in progress". */
  statusName: string | null;
  /**
   * Remote due date. Display only — an imported task always lands in the
   * backlog, because deciding a user's day for them is the one thing
   * this app must not do.
   */
  dueDate: Date | null;
  url: string;
  /** External project or list, rendered on the card's source chip. */
  containerName: string | null;
  remoteUpdatedAt: Date;
  subtasks: ExternalSubtask[];
}

/** One credential input rendered by the settings UI. */
export interface CredentialField {
  key: string;
  label: string;
  type: "password" | "text";
  placeholder?: string;
  help?: string;
}

export interface VerifiedAccount {
  providerAccountId: string;
  label: string;
  /**
   * The credential object to encrypt and store. Providers return this so
    * they can validate or enrich what the user typed without the route
    * layer knowing the credential shape.
   */
  credentials: unknown;
}

export interface TaskProvider {
  readonly id: string;
  readonly displayName: string;
  /** Where to find the credential the connect dialog asks for. */
  readonly docsUrl: string;
  readonly credentialFields: CredentialField[];
  readonly credentialSchema: z.ZodTypeAny;
  /** Shown as the import dialog's placeholder. */
  readonly referenceExample: string;

  /**
   * Prove the credential works and identify the account behind it.
   * Called from the connect route so a bad token fails loudly at connect
   * time rather than at the user's first import.
   */
  verifyCredentials(credentials: unknown): Promise<VerifiedAccount>;

  /**
   * Pull a task id out of whatever the user pasted — a full URL, a share
   * link, or a bare id. Returns null when this provider does not
   * recognize the input, which is also how the route picks a provider
   * when several are connected.
   */
  parseReference(input: string): string | null;

  /** Fetch one task by the id `parseReference` produced. */
  fetchTask(credentials: unknown, externalId: string): Promise<ExternalTask>;
}

/**
 * The credential was rejected (401 / 403) — the token was revoked or
 * mistyped. Routes return 401 and the UI prompts a reconnect.
 */
export class ProviderCredentialError extends Error {
  readonly code = "PROVIDER_CREDENTIAL_INVALID" as const;
  constructor(provider: string, detail?: string) {
    super(
      `${provider} rejected the stored credentials${detail ? `: ${detail}` : ""} — please reconnect the account`
    );
    this.name = "ProviderCredentialError";
  }
}

/**
 * The referenced object does not exist, or this token cannot see it.
 * Those two cases are indistinguishable from the outside, so the message
 * names both — a private task in another workspace is the most common
 * cause and the least obvious one.
 */
export class ProviderTaskNotFoundError extends Error {
  readonly code = "EXTERNAL_TASK_NOT_FOUND" as const;
  constructor(provider: string, externalId: string) {
    super(
      `${provider} has no task "${externalId}", or your token can't see it`
    );
    this.name = "ProviderTaskNotFoundError";
  }
}

/**
 * The provider is rate-limiting us (429).
 */
export class ProviderRateLimitError extends Error {
  readonly code = "PROVIDER_RATE_LIMITED" as const;
  constructor(
    provider: string,
    readonly retryAfterSeconds: number | null = null
  ) {
    super(`${provider} rate limit reached — try again in a moment`);
    this.name = "ProviderRateLimitError";
  }
}

/** Any other non-2xx from the provider. */
export class ProviderRequestError extends Error {
  readonly code = "PROVIDER_REQUEST_FAILED" as const;
  constructor(
    provider: string,
    readonly status: number,
    detail?: string
  ) {
    super(
      `${provider} request failed with ${status}${detail ? `: ${detail}` : ""}`
    );
    this.name = "ProviderRequestError";
  }
}

/**
 * Providers register at API startup. The database stores ids as strings,
 * so adding a provider does not require changing shared schemas.
 */
const PROVIDERS = new Map<string, TaskProvider>();

export function registerTaskProvider(provider: TaskProvider): void {
  if (!provider.id || provider.id.length > 32 || PROVIDERS.has(provider.id)) {
    throw new Error(`Invalid or duplicate task provider: ${provider.id}`);
  }
  PROVIDERS.set(provider.id, provider);
}

export function getTaskProvider(id: string): TaskProvider {
  const provider = PROVIDERS.get(id);
  if (!provider) {
    throw new NotFoundError(`Task provider ${id}`);
  }
  return provider;
}

export function hasTaskProvider(id: string): boolean {
  return PROVIDERS.has(id);
}

export function listTaskProviders(): TaskProvider[] {
  return [...PROVIDERS.values()];
}
