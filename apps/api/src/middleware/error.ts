/**
 * Global error handling middleware for Open Sunsama API
 */

import type { Context, ErrorHandler } from 'hono';
import { isAppError, ValidationError } from '@open-sunsama/utils';
import { ZodError } from 'zod';

/**
 * Format Zod validation errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }
  
  return errors;
}

/**
 * Global error handler middleware
 * Converts various error types to consistent API responses
 */
export const errorHandler: ErrorHandler = (err, c: Context) => {
  console.error('[Error]', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          statusCode: 400,
          errors: formatZodErrors(err),
        },
      },
      400
    );
  }

  // Handle custom AppError instances
  if (isAppError(err)) {
    const response: Record<string, unknown> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
    };

    // Add validation errors if present
    if (err instanceof ValidationError) {
      response.error = {
        ...(response.error as object),
        errors: err.errors,
      };
    }

    return c.json(response, err.statusCode as 400 | 401 | 403 | 404 | 409 | 429 | 500);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return c.json(
      {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
          statusCode: 401,
        },
      },
      401
    );
  }

  // Handle unknown errors
  const isProduction = process.env.NODE_ENV === 'production';
  
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isProduction ? 'Internal server error' : err.message || 'Unknown error',
        statusCode: 500,
      },
    },
    500
  );
};

/**
 * Not found handler for unmatched routes
 */
export function notFoundHandler(c: Context) {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND_ERROR',
        message: `Route ${c.req.method} ${c.req.path} not found`,
        statusCode: 404,
      },
    },
    404
  );
}
