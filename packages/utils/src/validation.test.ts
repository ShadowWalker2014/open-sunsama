import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  uuidSchema,
  dateSchema,
  timeSchema,
  taskSchema,
  timeBlockSchema,
  paginationSchema,
} from './validation.js';

describe('validation schemas', () => {
  describe('emailSchema', () => {
    it('should validate a correct email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should convert email to lowercase', () => {
      const result = emailSchema.safeParse('TEST@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should trim whitespace', () => {
      const result = emailSchema.safeParse('  test@example.com  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('should validate a strong password', () => {
      const result = passwordSchema.safeParse('Password123');
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = passwordSchema.safeParse('Pass1');
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('password123');
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = passwordSchema.safeParse('PASSWORD123');
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = passwordSchema.safeParse('PasswordABC');
      expect(result.success).toBe(false);
    });
  });

  describe('uuidSchema', () => {
    it('should validate a correct UUID', () => {
      const result = uuidSchema.safeParse('123e4567-e89b-12d3-a456-426614174000');
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = uuidSchema.safeParse('invalid-uuid');
      expect(result.success).toBe(false);
    });
  });

  describe('dateSchema', () => {
    it('should validate YYYY-MM-DD format', () => {
      const result = dateSchema.safeParse('2024-01-15');
      expect(result.success).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = dateSchema.safeParse('01-15-2024');
      expect(result.success).toBe(false);
    });

    it('should reject invalid date', () => {
      const result = dateSchema.safeParse('2024-13-45');
      expect(result.success).toBe(false);
    });
  });

  describe('timeSchema', () => {
    it('should validate HH:mm format', () => {
      const result = timeSchema.safeParse('14:30');
      expect(result.success).toBe(true);
    });

    it('should validate single digit hour', () => {
      const result = timeSchema.safeParse('9:05');
      expect(result.success).toBe(true);
    });

    it('should reject invalid hour', () => {
      const result = timeSchema.safeParse('25:00');
      expect(result.success).toBe(false);
    });

    it('should reject invalid minutes', () => {
      const result = timeSchema.safeParse('12:60');
      expect(result.success).toBe(false);
    });
  });

  describe('taskSchema', () => {
    it('should validate a complete task', () => {
      const task = {
        title: 'Test Task',
        description: 'A test task description',
        priority: 'high' as const,
        status: 'pending' as const,
        dueDate: '2024-01-15',
        estimatedMins: 60,
        tags: ['work', 'urgent'],
      };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const task = { title: 'Test Task' };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('medium');
        expect(result.data.status).toBe('pending');
        expect(result.data.tags).toEqual([]);
      }
    });

    it('should reject empty title', () => {
      const task = { title: '' };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const task = { title: 'Test', priority: 'invalid' };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });

    it('should reject too many tags', () => {
      const task = {
        title: 'Test',
        tags: Array(11).fill('tag'),
      };
      const result = taskSchema.safeParse(task);
      expect(result.success).toBe(false);
    });
  });

  describe('timeBlockSchema', () => {
    it('should validate a complete time block', () => {
      const block = {
        date: '2024-01-15',
        startTime: '09:00',
        endTime: '10:30',
        status: 'scheduled' as const,
        notes: 'Test notes',
      };
      const result = timeBlockSchema.safeParse(block);
      expect(result.success).toBe(true);
    });

    it('should reject end time before start time', () => {
      const block = {
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '09:00',
      };
      const result = timeBlockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });

    it('should reject equal start and end times', () => {
      const block = {
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '10:00',
      };
      const result = timeBlockSchema.safeParse(block);
      expect(result.success).toBe(false);
    });
  });

  describe('paginationSchema', () => {
    it('should validate pagination params', () => {
      const result = paginationSchema.safeParse({ page: 2, limit: 50 });
      expect(result.success).toBe(true);
    });

    it('should use defaults', () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce strings to numbers', () => {
      const result = paginationSchema.safeParse({ page: '3', limit: '25' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });

    it('should reject page less than 1', () => {
      const result = paginationSchema.safeParse({ page: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject limit greater than 100', () => {
      const result = paginationSchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });
});
