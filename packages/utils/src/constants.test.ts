import { describe, it, expect } from 'vitest';
import {
  API_KEY_PREFIX,
  DEFAULT_TIMEZONE,
  ESTIMATED_MINS_OPTIONS,
  DATE_FORMAT,
  TIME_FORMAT,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  API_KEY_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TIME_BLOCK_STATUSES,
} from './constants.js';

describe('constants', () => {
  it('should have correct API_KEY_PREFIX', () => {
    expect(API_KEY_PREFIX).toBe('cf_');
  });

  it('should have correct DEFAULT_TIMEZONE', () => {
    expect(DEFAULT_TIMEZONE).toBe('UTC');
  });

  it('should have correct ESTIMATED_MINS_OPTIONS', () => {
    expect(ESTIMATED_MINS_OPTIONS).toEqual([15, 30, 45, 60, 90, 120]);
  });

  it('should have correct DATE_FORMAT', () => {
    expect(DATE_FORMAT).toBe('yyyy-MM-dd');
  });

  it('should have correct TIME_FORMAT', () => {
    expect(TIME_FORMAT).toBe('HH:mm');
  });

  it('should have correct password constraints', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(MAX_PASSWORD_LENGTH).toBe(128);
  });

  it('should have correct API_KEY_LENGTH', () => {
    expect(API_KEY_LENGTH).toBe(32);
  });

  it('should have correct TASK_PRIORITIES', () => {
    expect(TASK_PRIORITIES).toEqual(['low', 'medium', 'high', 'urgent']);
  });

  it('should have correct TASK_STATUSES', () => {
    expect(TASK_STATUSES).toEqual(['pending', 'in_progress', 'completed', 'cancelled']);
  });

  it('should have correct TIME_BLOCK_STATUSES', () => {
    expect(TIME_BLOCK_STATUSES).toEqual(['scheduled', 'in_progress', 'completed', 'skipped']);
  });
});
