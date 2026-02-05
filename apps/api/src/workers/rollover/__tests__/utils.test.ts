/**
 * Tests for rollover utility functions
 */
import { describe, it, expect } from "vitest";
import { toZonedTime } from "date-fns-tz";
import { format, subDays } from "date-fns";
import { chunkArray, checkDSTTransition, BATCH_SIZE } from "../utils.js";

describe("Rollover Utils", () => {
  describe("chunkArray", () => {
    it("should chunk array into batches of specified size", () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = chunkArray(input, 3);
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });

    it("should return single chunk for arrays smaller than batch size", () => {
      const input = [1, 2, 3];
      const result = chunkArray(input, 5);
      expect(result).toEqual([[1, 2, 3]]);
    });

    it("should return empty array for empty input", () => {
      const result = chunkArray([], 5);
      expect(result).toEqual([]);
    });

    it("should handle exact batch size", () => {
      const input = [1, 2, 3, 4, 5, 6];
      const result = chunkArray(input, 3);
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ]);
    });
  });

  describe("BATCH_SIZE constant", () => {
    it("should be 100", () => {
      expect(BATCH_SIZE).toBe(100);
    });
  });

  describe("checkDSTTransition", () => {
    it("should return false for non-DST dates", () => {
      // Mid-January is not a DST transition
      const date = new Date("2026-01-15T08:00:00Z");
      expect(checkDSTTransition("America/Los_Angeles", date)).toBe(false);
    });

    // Note: DST transitions in 2026:
    // Spring forward: March 8, 2026 at 2:00 AM PST
    // Fall back: November 1, 2026 at 2:00 AM PDT
    it("should return true for DST spring forward date", () => {
      // March 8, 2026 is DST transition day
      const date = new Date("2026-03-08T10:00:00Z");
      expect(checkDSTTransition("America/Los_Angeles", date)).toBe(true);
    });

    it("should return true for DST fall back date", () => {
      // November 1, 2026 is DST transition day
      const date = new Date("2026-11-01T09:00:00Z");
      expect(checkDSTTransition("America/Los_Angeles", date)).toBe(true);
    });
  });

  describe("Timezone rollover date calculations", () => {
    it("should correctly calculate today and yesterday in PST timezone", () => {
      // Feb 5, 2026 at midnight PST = Feb 5, 2026 at 08:00 UTC
      const utcTime = new Date("2026-02-05T08:00:00Z");
      const timezone = "America/Los_Angeles";

      const zonedNow = toZonedTime(utcTime, timezone);
      const todayInTz = format(zonedNow, "yyyy-MM-dd");
      const yesterdayInTz = format(subDays(zonedNow, 1), "yyyy-MM-dd");

      expect(todayInTz).toBe("2026-02-05");
      expect(yesterdayInTz).toBe("2026-02-04");
    });

    it("should correctly detect midnight window", () => {
      const utcTime = new Date("2026-02-05T08:05:00Z"); // 00:05 PST
      const timezone = "America/Los_Angeles";

      const zonedNow = toZonedTime(utcTime, timezone);
      const currentHour = zonedNow.getHours();
      const currentMinute = zonedNow.getMinutes();

      const isMidnightWindow = currentHour === 0 && currentMinute <= 10;

      expect(currentHour).toBe(0);
      expect(currentMinute).toBe(5);
      expect(isMidnightWindow).toBe(true);
    });

    it("should correctly reject outside midnight window", () => {
      const utcTime = new Date("2026-02-05T08:15:00Z"); // 00:15 PST - outside window
      const timezone = "America/Los_Angeles";

      const zonedNow = toZonedTime(utcTime, timezone);
      const currentHour = zonedNow.getHours();
      const currentMinute = zonedNow.getMinutes();

      const isMidnightWindow = currentHour === 0 && currentMinute <= 10;

      expect(currentHour).toBe(0);
      expect(currentMinute).toBe(15);
      expect(isMidnightWindow).toBe(false);
    });

    it("should handle different timezones correctly", () => {
      // When it's midnight in Tokyo (UTC+9), it's 3 PM UTC
      const utcTime = new Date("2026-02-05T15:00:00Z");
      const timezone = "Asia/Tokyo";

      const zonedNow = toZonedTime(utcTime, timezone);
      const currentHour = zonedNow.getHours();

      expect(currentHour).toBe(0); // Midnight in Tokyo
    });
  });
});
