/**
 * API Keys API methods
 * @module @open-sunsama/api-client/api-keys
 */

import type {
  ApiKey,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
  ApiKeyFilterInput,
  ApiKeyWithStats,
  ApiKeyUsageSummary,
} from "@open-sunsama/types";
import type { OpenSunsamaClient, RequestOptions } from "./client.js";

// API response wrapper type
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
}

/**
 * API Keys API interface
 */
export interface ApiKeysApi {
  list(filters?: ApiKeyFilterInput, options?: RequestOptions): Promise<ApiKey[]>;
  listWithStats(filters?: ApiKeyFilterInput, options?: RequestOptions): Promise<ApiKeyWithStats[]>;
  create(input: CreateApiKeyInput, options?: RequestOptions): Promise<CreateApiKeyResponse>;
  get(id: string, options?: RequestOptions): Promise<ApiKey>;
  getWithStats(id: string, options?: RequestOptions): Promise<ApiKeyWithStats>;
  update(id: string, input: UpdateApiKeyInput, options?: RequestOptions): Promise<ApiKey>;
  revoke(id: string, options?: RequestOptions): Promise<void>;
  getUsageSummary(id: string, startDate: string, endDate: string, options?: RequestOptions): Promise<ApiKeyUsageSummary>;
  validate(key: string, options?: RequestOptions): Promise<{ valid: boolean; apiKey?: ApiKey }>;
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
    lastUsedAfter: filters.lastUsedAfter instanceof Date ? filters.lastUsedAfter.toISOString() : filters.lastUsedAfter,
  };
}

/**
 * Create API keys API methods bound to a client
 */
export function createApiKeysApi(client: OpenSunsamaClient): ApiKeysApi {
  return {
    async list(filters?: ApiKeyFilterInput, options?: RequestOptions): Promise<ApiKey[]> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<ApiKey[]>>("api-keys", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
      return response.data;
    },

    async listWithStats(filters?: ApiKeyFilterInput, options?: RequestOptions): Promise<ApiKeyWithStats[]> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<ApiKeyWithStats[]>>("api-keys", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams, includeStats: true },
      });
      return response.data;
    },

    async create(input: CreateApiKeyInput, options?: RequestOptions): Promise<CreateApiKeyResponse> {
      const payload = {
        ...input,
        expiresAt: input.expiresAt instanceof Date ? input.expiresAt.toISOString() : input.expiresAt,
      };
      const response = await client.post<ApiResponseWrapper<CreateApiKeyResponse>>("api-keys", payload, options);
      return response.data;
    },

    async get(id: string, options?: RequestOptions): Promise<ApiKey> {
      const response = await client.get<ApiResponseWrapper<ApiKey>>(`api-keys/${id}`, options);
      return response.data;
    },

    async getWithStats(id: string, options?: RequestOptions): Promise<ApiKeyWithStats> {
      const response = await client.get<ApiResponseWrapper<ApiKeyWithStats>>(`api-keys/${id}`, {
        ...options,
        searchParams: { ...options?.searchParams, includeStats: true },
      });
      return response.data;
    },

    async update(id: string, input: UpdateApiKeyInput, options?: RequestOptions): Promise<ApiKey> {
      const payload = {
        ...input,
        expiresAt: input.expiresAt instanceof Date ? input.expiresAt.toISOString() : input.expiresAt,
      };
      const response = await client.patch<ApiResponseWrapper<ApiKey>>(`api-keys/${id}`, payload, options);
      return response.data;
    },

    async revoke(id: string, options?: RequestOptions): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>(`api-keys/${id}`, options);
    },

    async getUsageSummary(id: string, startDate: string, endDate: string, options?: RequestOptions): Promise<ApiKeyUsageSummary> {
      const response = await client.get<ApiResponseWrapper<ApiKeyUsageSummary>>(`api-keys/${id}/usage`, {
        ...options,
        searchParams: { ...options?.searchParams, startDate, endDate },
      });
      return response.data;
    },

    async validate(key: string, options?: RequestOptions): Promise<{ valid: boolean; apiKey?: ApiKey }> {
      const response = await client.post<ApiResponseWrapper<{ valid: boolean; apiKey?: ApiKey }>>("api-keys/validate", { key }, options);
      return response.data;
    },

    async regenerate(id: string, options?: RequestOptions): Promise<CreateApiKeyResponse> {
      const response = await client.post<ApiResponseWrapper<CreateApiKeyResponse>>(`api-keys/${id}/regenerate`, undefined, options);
      return response.data;
    },
  };
}
