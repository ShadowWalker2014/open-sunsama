/**
 * Task-source integration types shared between API and clients.
 */

export interface IntegrationCredentialField {
  key: string;
  label: string;
  type: 'password' | 'text';
  placeholder?: string;
  help?: string;
}

export interface IntegrationProviderInfo {
  id: string;
  displayName: string;
  docsUrl: string;
  credentialFields: IntegrationCredentialField[];
  /** Example reference, shown as the import dialog's placeholder. */
  referenceExample: string;
}

export interface IntegrationAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  /** Workspace / team name shown on the settings card. */
  label: string;
  /** The credential itself is never sent to a client. */
  hasCredentials: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Providers may expose object kinds beyond the initial task/issue/PR set. */
export type ExternalLinkKind = string;

export type ExternalLinkRole = 'source' | 'reference';
export type ExternalLinkStatus = 'active' | 'orphaned';

export interface ExternalLinkMeta {
  containerName?: string | null;
  statusName?: string | null;
  dueDate?: string | null;
}

/**
 * A pointer from a local task to an object in an external system. A
 * task may carry several at once — the external task it came from plus
 * the pull request that closes it.
 */
export interface TaskExternalLink {
  id: string;
  userId: string;
  taskId: string;
  accountId: string | null;
  provider: string;
  externalId: string;
  externalUrl: string | null;
  kind: ExternalLinkKind;
  role: ExternalLinkRole;
  status: ExternalLinkStatus;
  remoteUpdatedAt: string | null;
  remoteMeta: ExternalLinkMeta | null;
  lastRefreshedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectIntegrationRequest {
  provider: string;
  credentials: Record<string, unknown>;
}

/** A pasted task link or bare id. */
export interface ImportTaskRequest {
  reference: string;
}

export interface CreateTaskLinkRequest {
  provider: string;
  externalId: string;
  externalUrl: string;
  kind?: ExternalLinkKind;
  label?: string;
}
