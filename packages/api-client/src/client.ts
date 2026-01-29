/**
 * API Client implementation using ky
 * @module @open-sunsama/api-client/client
 */

import ky, { type KyInstance, type Options as KyOptions } from "ky";
import { ApiError } from "./errors.js";

/**
 * API Client configuration options
 */
export interface ApiClientConfig {
  /** Base URL for the API (e.g., "https://api.opensunsama.app/v1") */
  baseUrl: string;

  /** JWT token for authentication */
  token?: string;

  /** API key for authentication (alternative to JWT) */
  apiKey?: string;

  /** Default timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Additional default headers */
  defaultHeaders?: Record<string, string>;

  /** Hook called before each request */
  onRequest?: (request: Request) => void | Promise<void>;

  /** Hook called after each response */
  onResponse?: (response: Response) => void | Promise<void>;

  /** Hook called on errors */
  onError?: (error: ApiError) => void | Promise<void>;

  /** Custom retry configuration */
  retry?: {
    /** Number of retries (default: 2) */
    limit?: number;
    /** HTTP methods to retry (default: ['GET']) */
    methods?: string[];
    /** Status codes to retry (default: [408, 413, 429, 500, 502, 503, 504]) */
    statusCodes?: number[];
  };
}

/**
 * HTTP request options
 */
export interface RequestOptions {
  /** Additional headers for this request */
  headers?: Record<string, string>;

  /** Abort signal for cancellation */
  signal?: AbortSignal;

  /** Request-specific timeout in milliseconds */
  timeout?: number;

  /** Query parameters */
  searchParams?: Record<string, string | number | boolean | undefined>;
}

/**
 * Create a configured ky instance for API requests
 */
export function createApiClient(config: ApiClientConfig): KyInstance {
  const {
    baseUrl,
    token,
    apiKey,
    timeout = 30000,
    defaultHeaders = {},
    onRequest,
    onResponse,
    onError,
    retry = {},
  } = config;

  // Build authorization header
  const getAuthHeader = (): Record<string, string> => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    if (apiKey) {
      return { "X-API-Key": apiKey };
    }
    return {};
  };

  const client = ky.create({
    prefixUrl: baseUrl,
    timeout,
    retry: {
      limit: retry.limit ?? 2,
      methods: retry.methods ?? ["get"],
      statusCodes: retry.statusCodes ?? [408, 413, 429, 500, 502, 503, 504],
    },
    hooks: {
      beforeRequest: [
        async (request) => {
          // Add default headers
          const authHeaders = getAuthHeader();
          Object.entries({ ...defaultHeaders, ...authHeaders }).forEach(
            ([key, value]) => {
              if (!request.headers.has(key)) {
                request.headers.set(key, value);
              }
            }
          );

          // Call custom hook
          if (onRequest) {
            await onRequest(request);
          }
        },
      ],
      afterResponse: [
        async (_request, _options, response) => {
          if (onResponse) {
            await onResponse(response);
          }
        },
      ],
      beforeError: [
        async (error) => {
          // Transform ky errors into ApiError
          const { response } = error;
          if (response) {
            const apiError = await ApiError.fromResponse(response);
            if (onError) {
              await onError(apiError);
            }
            throw apiError;
          }
          // Network or other errors
          const networkError = new ApiError(
            error.message || "Network error",
            0,
            "NETWORK_ERROR"
          );
          if (onError) {
            await onError(networkError);
          }
          throw networkError;
        },
      ],
    },
  });

  return client;
}

/**
 * API Client wrapper with typed methods
 */
export class OpenSunsamaClient {
  private client: KyInstance;
  private token: string | undefined;
  private apiKey: string | undefined;

  constructor(private config: ApiClientConfig) {
    this.token = config.token;
    this.apiKey = config.apiKey;
    this.client = createApiClient(config);
  }

  /**
   * Update the authentication token
   */
  setToken(token: string | undefined): void {
    this.token = token;
    // Recreate client with new token
    const newConfig: ApiClientConfig = {
      ...this.config,
    };
    if (token !== undefined) {
      newConfig.token = token;
    }
    if (this.apiKey !== undefined) {
      newConfig.apiKey = this.apiKey;
    }
    this.client = createApiClient(newConfig);
  }

  /**
   * Update the API key
   */
  setApiKey(apiKey: string | undefined): void {
    this.apiKey = apiKey;
    // Recreate client with new API key
    const newConfig: ApiClientConfig = {
      ...this.config,
    };
    if (this.token !== undefined) {
      newConfig.token = this.token;
    }
    if (apiKey !== undefined) {
      newConfig.apiKey = apiKey;
    }
    this.client = createApiClient(newConfig);
  }

  /**
   * Get the underlying ky instance
   */
  getClient(): KyInstance {
    return this.client;
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const kyOptions = this.buildKyOptions(options);
    return this.client.get(path, kyOptions).json<T>();
  }

  /**
   * Make a POST request
   */
  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const kyOptions = this.buildKyOptions(options);
    if (body !== undefined) {
      kyOptions.json = body;
    }
    return this.client.post(path, kyOptions).json<T>();
  }

  /**
   * Make a PUT request
   */
  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const kyOptions = this.buildKyOptions(options);
    if (body !== undefined) {
      kyOptions.json = body;
    }
    return this.client.put(path, kyOptions).json<T>();
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const kyOptions = this.buildKyOptions(options);
    if (body !== undefined) {
      kyOptions.json = body;
    }
    return this.client.patch(path, kyOptions).json<T>();
  }

  /**
   * Make a DELETE request
   */
  async delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
    const kyOptions = this.buildKyOptions(options);
    const response = await this.client.delete(path, kyOptions);

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json<T>();
  }

  /**
   * Build ky options from request options
   */
  private buildKyOptions(options?: RequestOptions): KyOptions {
    const kyOptions: KyOptions = {};

    if (options?.headers) {
      kyOptions.headers = options.headers;
    }

    if (options?.signal) {
      kyOptions.signal = options.signal;
    }

    if (options?.timeout) {
      kyOptions.timeout = options.timeout;
    }

    if (options?.searchParams) {
      // Filter out undefined values
      const filteredParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(options.searchParams)) {
        if (value !== undefined) {
          filteredParams[key] = String(value);
        }
      }
      kyOptions.searchParams = filteredParams;
    }

    return kyOptions;
  }
}

/**
 * Create a new Open Sunsama API client instance
 */
export function createOpenSunsamaClient(
  config: ApiClientConfig
): OpenSunsamaClient {
  return new OpenSunsamaClient(config);
}

// Legacy aliases for backwards compatibility
export const ChronoflowClient = OpenSunsamaClient;
export const createChronoflowClient = createOpenSunsamaClient;

export type { KyInstance };
