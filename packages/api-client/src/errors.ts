// API Client errors

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Create an ApiError from a response
   */
  static async fromResponse(response: Response): Promise<ApiError> {
    let message = `Request failed with status ${response.status}`;
    let code: string | undefined;
    let details: Record<string, unknown> | undefined;

    try {
      const body = await response.json();
      if (body.error) {
        message = body.error.message || message;
        code = body.error.code;
        details = body.error.details;
      }
    } catch {
      // Ignore JSON parse errors
    }

    return new ApiError(message, response.status, code, details);
  }

  /**
   * Check if error is a network error
   */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /**
   * Check if error is a client error (4xx)
   */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  get isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if error is unauthorized
   */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * Check if error is forbidden
   */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /**
   * Check if error is not found
   */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Check if error is rate limited
   */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
