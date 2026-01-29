/**
 * Custom error classes for Chronoflow
 */

/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'APP_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.errors = errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

/**
 * Error thrown when authorization fails
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly resourceId: string | undefined;

  constructor(resource: string, resourceId?: string) {
    const message = resourceId
      ? `${resource} with id '${resourceId}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND_ERROR', 404);
    this.resource = resource;
    this.resourceId = resourceId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      ...(this.resourceId !== undefined && { resourceId: this.resourceId }),
    };
  }
}

/**
 * Error thrown when there's a conflict (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  public readonly conflictField: string | undefined;

  constructor(message: string, conflictField?: string) {
    super(message, 'CONFLICT_ERROR', 409);
    this.conflictField = conflictField;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.conflictField !== undefined && { conflictField: this.conflictField }),
    };
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number | undefined;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      ...(this.retryAfter !== undefined && { retryAfter: this.retryAfter }),
    };
  }
}

/**
 * Error thrown for internal server errors
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 'INTERNAL_ERROR', 500, false);
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}
