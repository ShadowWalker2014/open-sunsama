/**
 * API Keys API methods
 * @module @chronoflow/api-client/api-keys
 */

import type {
  ApiKey,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
  ApiKeyFilterInput,
  ApiKeyWithStats,
  ApiKeyUsageSummary,
} from "@chronoflow/types";
import type { ChronoflowClient, RequestOptions } from "./client.js";

/**
 * API Keys API interface
 */
export interface ApiKeysApi {
  /**
   * List all API keys for the current user
   * @param filters Optional filter criteria
   * @returns Array of API keys
   */
  list(filters?: ApiKeyFilterInput, options?: RequestOptions): Promise<ApiKey[]>;

  /**
   * List API keys with usage statistics
   * @param filters Optional filter criteria
   * @returns Array of API keys with stats
   */
  listWithStats(
    filters?: ApiKeyFilterInput,
    options?: RequestOptions
  ): Promise<ApiKeyWithStats[]>;

  /**
   * Create a new API key
   * @param input API key creation data
   * @returns The created API key with the raw key value (only shown once)
   */
  create(
    input: CreateApiKeyInput,
    options?: RequestOptions
  ): Promise<CreateApiKeyResponse>;

  /**
   * Get an API key by ID
   * @param id API key ID
   * @returns The API key data
   */
  get(id: string, options?: RequestOptions): Promise<ApiKey>;

  /**
   * Get an API key with usage statistics
   * @param id API key ID
   * @returns The API key with stats
   */
  getWithStats(id: string, options?: RequestOptions): Promise<ApiKeyWithStats>;

  /**
   * Update an API key
   * @param id API key ID
   * @param input Fields to update
   * @returns The updated API key
   */
  update(
    id: string,
    input: UpdateApiKeyInput,
    options?: RequestOptions
  ): Promise<ApiKey>;

  /**
   * Revoke (delete) an API key
   * @param id API key ID
   */
  revoke(id: string, options?: RequestOptions): Promise<void>;

  /**
   * Get usage summary for an API key
   * @param id API key ID
   * @param startDate Start of the period (ISO date string)
   * @param endDate End of the period (ISO date string)
   * @returns Usage summary
   */
  getUsageSummary(
    id: string,
    startDate: string,
    endDate: string,
    options?: RequestOptions
  ): Promise<ApiKeyUsageSummary>;

  /**
   * Validate an API key (check if it's valid and not expired)
   * @param key The raw API key value
   * @returns Whether the key is valid
   */
  validate(key: string, options?: RequestOptions): Promise<{ valid: boolean; apiKey?: ApiKey }>;

  /**
   * Regenerate an API key (revokes old key and creates new one with same settings)
   * @param id API key ID
   * @returns The new API key with the raw key value
   */
  regenerate(id: string, options?: RequestOptions): Promise<CreateApiKeyResponse>;
}

/**
 * Convert ApiKeyFilterInput to query parameters
 */
function filtersToSearchParams(
  filters?: ApiKeyFilterInput
): Record<string, string | number | boolean | undefined> {
  if (!filters) return {};

  return {
    nameSearch: filters.nameSearch,
    expired: filters.expired,
    hasScope: filters.hasScope,
    lastUsedAfter:
      filters.lastUsedAfter instanceof Date
        ? filters.lastUsedAfter.toISOString()
        : filters.lastUsedAfter,
  };
}

/**
 * Create API keys API methods bound to a client
 * @param client The Chronoflow client instance
 * @returns API keys API methods
 */
export function createApiKeysApi(client: ChronoflowClient): ApiKeysApi {
  return {
    async list(
      filters?: ApiKeyFilterInput,
      options?: RequestOptions
    ): Promise<ApiKey[]> {
      const searchParams = filtersToSearchParams(filters);
      return client.get<ApiKey[]>("api-keys", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
    },

    async listWithStats(
      filters?: ApiKeyFilterInput,
      options?: RequestOptions
    ): Promise<ApiKeyWithStats[]> {
      const searchParams = filtersToSearchParams(filters);
      return client.get<ApiKeyWithStats[]>("api-keys", {
        ...options,
        searchParams: {
          ...options?.searchParams,
          ...searchParams,
          includeStats: true,
        },
      });
    },

    async create(
      input: CreateApiKeyInput,
      options?: RequestOptions
    ): Promise<CreateApiKeyResponse> {
      // Serialize expiresAt if it's a Date
      const payload = {
        ...input,
        expiresAt:
          input.expiresAt instanceof Date
            ? input.expiresAt.toISOString()
            : input.expiresAt,
      };
      return client.post<CreateApiKeyResponse>("api-keys", payload, options);
    },

    async get(id: string, options?: RequestOptions): Promise<ApiKey> {
      return client.get<ApiKey>(`api-keys/${id}`, options);
    },

    async getWithStats(
      id: string,
      options?: RequestOptions
    ): Promise<ApiKeyWithStats> {
      return client.get<ApiKeyWithStats>(`api-keys/${id}`, {
        ...options,
        searchParams: { ...options?.searchParams, includeStats: true },
      });
    },

    async update(
      id: string,
      input: UpdateApiKeyInput,
      options?: RequestOptions
    ): Promise<ApiKey> {
      // Serialize expiresAt if it's a Date
      const payload = {
        ...input,
        expiresAt:
          input.expiresAt instanceof Date
            ? input.expiresAt.toISOString()
            : input.expiresAt,
      };
      return client.patch<ApiKey>(`api-keys/${id}`, payload, options);
    },

    async revoke(id: string, options?: RequestOptions): Promise<void> {
      return client.delete<void>(`api-keys/${id}`, options);
    },

    async getUsageSummary(
      id: string,
      startDate: string,
      endDate: string,
      options?: RequestOptions
    ): Promise<ApiKeyUsageSummary> {
      return client.get<ApiKeyUsageSummary>(`api-keys/${id}/usage`, {
        ...options,
        searchParams: {
          ...options?.searchParams,
          startDate,
          endDate,
        },
      });
    },

    async validate(
      key: string,
      options?: RequestOptions
    ): Promise<{ valid: boolean; apiKey?: ApiKey }> {
      return client.post<{ valid: boolean; apiKey?: ApiKey }>(
        "api-keys/validate",
        { key },
        options
      );
    },

    async regenerate(
      id: string,
      options?: RequestOptions
    ): Promise<CreateApiKeyResponse> {
      return client.post<CreateApiKeyResponse>(
        `api-keys/${id}/regenerate`,
        undefined,
        options
      );
    },
  };
}
