import { describe, it, expect } from 'vitest';
import {
  formatDate,
  parseDate,
  getDateRange,
  isToday,
  isSameDay,
  getDaysBetween,
  formatTime,
  parseTime,
  addMinutes,
  getStartOfDay,
  createDateTime,
} from './date.js';

describe('date utilities', () => {
  describe('formatDate', () => {
    it('should format a date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should handle single digit months and days', () => {
      const date = new Date(2024, 0, 5); // Jan 5, 2024
      expect(formatDate(date)).toBe('2024-01-05');
    });
  });

  describe('parseDate', () => {
    it('should parse a valid date string', () => {
      const result = parseDate('2024-01-15');
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    it('should throw for invalid date string', () => {
      expect(() => parseDate('invalid')).toThrow('Invalid date string');
    });

    it('should throw for wrong format', () => {
      expect(() => parseDate('01-15-2024')).toThrow('Invalid date string');
    });
  });

  describe('getDateRange', () => {
    it('should return correct range of dates', () => {
      const center = new Date(2024, 0, 15); // Jan 15, 2024
      const range = getDateRange(center, 2, 2);
      
      expect(range).toHaveLength(5); // 2 before + center + 2 after
      expect(formatDate(range[0]!)).toBe('2024-01-13');
      expect(formatDate(range[2]!)).toBe('2024-01-15'); // center
      expect(formatDate(range[4]!)).toBe('2024-01-17');
    });

    it('should handle month boundaries', () => {
      const center = new Date(2024, 1, 1); // Feb 1, 2024
      const range = getDateRange(center, 2, 0);
      
      expect(range).toHaveLength(3);
      expect(formatDate(range[0]!)).toBe('2024-01-30');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date(2024, 0, 15, 10, 30);
      const date2 = new Date(2024, 0, 15, 20, 45);
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('getDaysBetween', () => {
    it('should return all days between two dates', () => {
      const start = new Date(2024, 0, 10);
      const end = new Date(2024, 0, 15);
      const days = getDaysBetween(start, end);
      
      expect(days).toHaveLength(6); // Inclusive
      expect(formatDate(days[0]!)).toBe('2024-01-10');
      expect(formatDate(days[5]!)).toBe('2024-01-15');
    });

    it('should handle same start and end date', () => {
      const date = new Date(2024, 0, 15);
      const days = getDaysBetween(date, date);
      
      expect(days).toHaveLength(1);
    });
  });

  describe('formatTime', () => {
    it('should format time as HH:mm', () => {
      const date = new Date(2024, 0, 15, 14, 30);
      expect(formatTime(date)).toBe('14:30');
    });

    it('should handle midnight', () => {
      const date = new Date(2024, 0, 15, 0, 0);
      expect(formatTime(date)).toBe('00:00');
    });

    it('should handle single digit hours/minutes', () => {
      const date = new Date(2024, 0, 15, 9, 5);
      expect(formatTime(date)).toBe('09:05');
    });
  });

  describe('parseTime', () => {
    it('should parse time and apply to date', () => {
      const baseDate = new Date(2024, 0, 15);
      const result = parseTime('14:30', baseDate);
      
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getDate()).toBe(15);
    });

    it('should handle single digit hour', () => {
      const baseDate = new Date(2024, 0, 15);
      const result = parseTime('9:05', baseDate);
      
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(5);
    });

    it('should throw for invalid time', () => {
      const baseDate = new Date(2024, 0, 15);
      expect(() => parseTime('25:00', baseDate)).toThrow('Invalid time string');
      expect(() => parseTime('12:60', baseDate)).toThrow('Invalid time string');
      expect(() => parseTime('invalid', baseDate)).toThrow('Invalid time string');
    });
  });

  describe('addMinutes', () => {
    it('should add positive minutes', () => {
      const date = new Date(2024, 0, 15, 10, 30);
      const result = addMinutes(date, 45);
      
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(15);
    });

    it('should add negative minutes', () => {
      const date = new Date(2024, 0, 15, 10, 30);
      const result = addMinutes(date, -45);
      
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(45);
    });

    it('should handle day rollover', () => {
      const date = new Date(2024, 0, 15, 23, 30);
      const result = addMinutes(date, 60);
      
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('getStartOfDay', () => {
    it('should return start of day', () => {
      const date = new Date(2024, 0, 15, 14, 30, 45);
      const result = getStartOfDay(date);
      
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getDate()).toBe(15);
    });
  });

  describe('createDateTime', () => {
    it('should combine date and time strings', () => {
      const result = createDateTime('2024-01-15', '14:30');
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });
  });
});
