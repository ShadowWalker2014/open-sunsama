/**
 * API key-related type definitions for Chronoflow
 * @module @chronoflow/types/api-key
 */

/**
 * Represents an API key in the Chronoflow system.
 * API keys allow programmatic access to the Chronoflow API.
 */
export interface ApiKey {
  /** Unique identifier for the API key (UUID format) */
  id: string;

  /** ID of the user who owns this API key */
  userId: string;

  /** 
   * Human-readable name/label for the API key.
   * Helps users identify the purpose of each key.
   */
  name: string;

  /** 
   * The API key prefix (first 8 characters).
   * Used for identification without exposing the full key.
   */
  keyPrefix: string;

  /** 
   * Hash of the full API key.
   * The actual key is only shown once upon creation.
   */
  keyHash: string;

  /** 
   * Permissions/scopes granted to this API key.
   * Defines what actions the key can perform.
   */
  scopes: ApiKeyScope[];

  /** 
   * Optional expiration date for the API key.
   * null indicates the key never expires.
   */
  expiresAt: Date | null;

  /** 
   * Timestamp of the last time this key was used.
   * null if the key has never been used.
   */
  lastUsedAt: Date | null;

  /** Timestamp when the API key was created */
  createdAt: Date;

  /** Timestamp when the API key was last updated */
  updatedAt: Date;
}

/**
 * Available permission scopes for API keys.
 * Each scope grants access to specific API operations.
 */
export type ApiKeyScope =
  /** Read-only access to tasks */
  | 'tasks:read'
  /** Full access to tasks (create, update, delete) */
  | 'tasks:write'
  /** Read-only access to time blocks */
  | 'time-blocks:read'
  /** Full access to time blocks (create, update, delete) */
  | 'time-blocks:write'
  /** Read-only access to user profile */
  | 'user:read'
  /** Full access to user profile (update) */
  | 'user:write'
  /** Full access to all resources */
  | 'all';

/**
 * Input data required to create a new API key.
 */
export interface CreateApiKeyInput {
  /** Human-readable name/label for the API key */
  name: string;

  /** 
   * Permissions/scopes to grant to this key.
   * Defaults to read-only access if not specified.
   */
  scopes?: ApiKeyScope[];

  /** 
   * Optional expiration date.
   * Omit or set to null for a non-expiring key.
   */
  expiresAt?: Date | string | null;
}

/**
 * Response returned after creating a new API key.
 * Contains the full key value (only shown once).
 */
export interface CreateApiKeyResponse {
  /** The created API key metadata */
  apiKey: ApiKey;

  /** 
   * The full API key value.
   * IMPORTANT: This is only shown once upon creation.
   * Store it securely as it cannot be retrieved later.
   */
  key: string;
}

/**
 * Input data for updating an existing API key.
 * Only name and scopes can be updated (not the key itself).
 */
export interface UpdateApiKeyInput {
  /** Updated name/label */
  name?: string;

  /** Updated scopes/permissions */
  scopes?: ApiKeyScope[];

  /** 
   * Updated expiration date.
   * Use null to remove expiration (make non-expiring).
   */
  expiresAt?: Date | string | null;
}

/**
 * Filter options for querying API keys.
 */
export interface ApiKeyFilterInput {
  /** Filter by name (partial match) */
  nameSearch?: string;

  /** Filter by expiration status */
  expired?: boolean;

  /** Filter to keys with specific scope */
  hasScope?: ApiKeyScope;

  /** Filter to keys used within a specific period */
  lastUsedAfter?: Date | string;
}

/**
 * API key with usage statistics.
 * Extended information for API key management UI.
 */
export interface ApiKeyWithStats extends ApiKey {
  /** Total number of times this key has been used */
  usageCount: number;

  /** Whether the key is currently expired */
  isExpired: boolean;

  /** Days until expiration (null if non-expiring or already expired) */
  daysUntilExpiry: number | null;
}

/**
 * Represents a single API key usage record.
 * Used for auditing and monitoring API access.
 */
export interface ApiKeyUsageRecord {
  /** Unique identifier for the usage record */
  id: string;

  /** ID of the API key used */
  apiKeyId: string;

  /** HTTP method of the request */
  method: string;

  /** API endpoint path accessed */
  endpoint: string;

  /** HTTP status code of the response */
  statusCode: number;

  /** IP address of the request origin */
  ipAddress: string | null;

  /** User agent string from the request */
  userAgent: string | null;

  /** Timestamp of the request */
  timestamp: Date;
}

/**
 * Summary of API key usage for a specific period.
 */
export interface ApiKeyUsageSummary {
  /** ID of the API key */
  apiKeyId: string;

  /** Start of the summary period */
  periodStart: Date;

  /** End of the summary period */
  periodEnd: Date;

  /** Total number of requests */
  totalRequests: number;

  /** Number of successful requests (2xx status codes) */
  successfulRequests: number;

  /** Number of failed requests (4xx/5xx status codes) */
  failedRequests: number;

  /** Most frequently accessed endpoints */
  topEndpoints: { endpoint: string; count: number }[];
}

/**
 * Configuration for API key generation.
 */
export interface ApiKeyConfig {
  /** Length of the generated key (in bytes, before encoding) */
  keyLength: number;

  /** Prefix to add to all keys (e.g., "cf_") */
  keyPrefix: string;

  /** Default scopes for new keys */
  defaultScopes: ApiKeyScope[];

  /** Maximum number of keys per user */
  maxKeysPerUser: number;

  /** Default expiration period in days (null for non-expiring) */
  defaultExpirationDays: number | null;
}
