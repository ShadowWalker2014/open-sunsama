import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalError,
  isAppError,
  isOperationalError,
} from './errors.js';

describe('error classes', () => {
  describe('AppError', () => {
    it('should create an error with defaults', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('APP_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should create an error with custom values', () => {
      const error = new AppError('Custom error', 'CUSTOM_CODE', 418, false);
      
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(418);
      expect(error.isOperational).toBe(false);
    });

    it('should serialize to JSON', () => {
      const error = new AppError('Test error', 'TEST', 400);
      const json = error.toJSON();
      
      expect(json).toEqual({
        name: 'AppError',
        message: 'Test error',
        code: 'TEST',
        statusCode: 400,
      });
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const errors = { email: ['Invalid email'] };
      const error = new ValidationError('Validation failed', errors);
      
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual(errors);
    });

    it('should serialize with errors', () => {
      const errors = { email: ['Invalid email'], password: ['Too short'] };
      const error = new ValidationError('Validation failed', errors);
      const json = error.toJSON();
      
      expect(json.errors).toEqual(errors);
    });
  });

  describe('AuthenticationError', () => {
    it('should create with default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should create with custom message', () => {
      const error = new AuthenticationError('Invalid token');
      
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('AuthorizationError', () => {
    it('should create with default message', () => {
      const error = new AuthorizationError();
      
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource name only', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe('User');
      expect(error.resourceId).toBeUndefined();
    });

    it('should create with resource and id', () => {
      const error = new NotFoundError('Task', '123');
      
      expect(error.message).toBe("Task with id '123' not found");
      expect(error.resourceId).toBe('123');
    });

    it('should serialize with resource info', () => {
      const error = new NotFoundError('Task', '123');
      const json = error.toJSON();
      
      expect(json.resource).toBe('Task');
      expect(json.resourceId).toBe('123');
    });

    it('should not include resourceId in JSON when undefined', () => {
      const error = new NotFoundError('Task');
      const json = error.toJSON();
      
      expect(json.resource).toBe('Task');
      expect('resourceId' in json).toBe(false);
    });
  });

  describe('ConflictError', () => {
    it('should create with message', () => {
      const error = new ConflictError('Email already exists');
      
      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should create with conflict field', () => {
      const error = new ConflictError('Email already exists', 'email');
      
      expect(error.conflictField).toBe('email');
    });

    it('should not include conflictField in JSON when undefined', () => {
      const error = new ConflictError('Conflict occurred');
      const json = error.toJSON();
      
      expect('conflictField' in json).toBe(false);
    });
  });

  describe('RateLimitError', () => {
    it('should create with default message', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
    });

    it('should create with retry after', () => {
      const error = new RateLimitError('Too many requests', 60);
      
      expect(error.retryAfter).toBe(60);
    });

    it('should not include retryAfter in JSON when undefined', () => {
      const error = new RateLimitError();
      const json = error.toJSON();
      
      expect('retryAfter' in json).toBe(false);
    });
  });

  describe('InternalError', () => {
    it('should create with default message', () => {
      const error = new InternalError();
      
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('isAppError', () => {
    it('should return true for AppError', () => {
      expect(isAppError(new AppError('test'))).toBe(true);
    });

    it('should return true for subclasses', () => {
      expect(isAppError(new ValidationError('test'))).toBe(true);
      expect(isAppError(new NotFoundError('test'))).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isAppError(new Error('test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isAppError('error')).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
    });
  });

  describe('isOperationalError', () => {
    it('should return true for operational errors', () => {
      expect(isOperationalError(new AppError('test'))).toBe(true);
      expect(isOperationalError(new ValidationError('test'))).toBe(true);
    });

    it('should return false for non-operational errors', () => {
      expect(isOperationalError(new InternalError())).toBe(false);
    });

    it('should return false for non-AppErrors', () => {
      expect(isOperationalError(new Error('test'))).toBe(false);
    });
  });
});
