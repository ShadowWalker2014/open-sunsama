import { describe, it, expect } from "vitest";
import { addDaysToDate, eventFallsInWindow, localDayWindow } from "./calendar-day-window.js";

const timed = (start: string, end: string) => ({
  startTime: new Date(start),
  endTime: new Date(end),
  isAllDay: false,
});
const allDay = (start: string, end: string) => ({
  startTime: new Date(`${start}T00:00:00Z`),
  endTime: new Date(`${end}T00:00:00Z`),
  isAllDay: true,
});

describe("localDayWindow", () => {
  it("covers whole local days in the user's timezone", () => {
    const tokyo = localDayWindow("2030-01-15", "2030-01-15", "Asia/Tokyo");
    expect(tokyo.start.toISOString()).toBe("2030-01-14T15:00:00.000Z");
    expect(tokyo.end.toISOString()).toBe("2030-01-15T15:00:00.000Z");

    const la = localDayWindow("2030-01-15", "2030-01-16", "America/Los_Angeles");
    expect(la.start.toISOString()).toBe("2030-01-15T08:00:00.000Z");
    expect(la.end.toISOString()).toBe("2030-01-17T08:00:00.000Z");
  });

  it("handles a daylight-saving day (23 hours long)", () => {
    const w = localDayWindow("2030-03-10", "2030-03-10", "America/New_York");
    expect(w.end.getTime() - w.start.getTime()).toBe(23 * 60 * 60 * 1000);
  });

  it("falls back to UTC for an unknown timezone", () => {
    const w = localDayWindow("2030-01-15", "2030-01-15", "Not/AZone");
    expect(w.timezone).toBe("UTC");
    expect(w.start.toISOString()).toBe("2030-01-15T00:00:00.000Z");
  });
});

describe("eventFallsInWindow", () => {
  const tokyo = localDayWindow("2030-01-15", "2030-01-15", "Asia/Tokyo");
  const la = localDayWindow("2030-01-15", "2030-01-15", "America/Los_Angeles");

  it("matches all-day events by date, not instant", () => {
    expect(eventFallsInWindow(allDay("2030-01-15", "2030-01-16"), tokyo)).toBe(true);
    expect(eventFallsInWindow(allDay("2030-01-14", "2030-01-15"), tokyo)).toBe(false);
    expect(eventFallsInWindow(allDay("2030-01-16", "2030-01-17"), la)).toBe(false);
    expect(eventFallsInWindow(allDay("2030-01-13", "2030-01-17"), la)).toBe(true);
  });

  it("treats a zero-length all-day event as one day", () => {
    expect(eventFallsInWindow(allDay("2030-01-15", "2030-01-15"), tokyo)).toBe(true);
  });

  it("uses half-open overlap for timed events", () => {
    // 23:00-23:30 Tokyo on the 14th.
    expect(eventFallsInWindow(timed("2030-01-14T14:00:00Z", "2030-01-14T14:30:00Z"), tokyo)).toBe(false);
    // Ends exactly at local midnight: belongs to the previous day only.
    expect(eventFallsInWindow(timed("2030-01-14T14:00:00Z", "2030-01-14T15:00:00Z"), tokyo)).toBe(false);
    // Crosses local midnight into the day.
    expect(eventFallsInWindow(timed("2030-01-14T14:30:00Z", "2030-01-14T15:30:00Z"), tokyo)).toBe(true);
    // Starts exactly at the next local midnight.
    expect(eventFallsInWindow(timed("2030-01-15T15:00:00Z", "2030-01-15T16:00:00Z"), tokyo)).toBe(false);
  });

  it("keeps zero-length timed events that start inside the day", () => {
    expect(eventFallsInWindow(timed("2030-01-14T15:00:00Z", "2030-01-14T15:00:00Z"), tokyo)).toBe(true);
  });
});

describe("addDaysToDate", () => {
  it("crosses month and year boundaries", () => {
    expect(addDaysToDate("2030-12-31", 1)).toBe("2031-01-01");
    expect(addDaysToDate("2030-03-01", -1)).toBe("2030-02-28");
  });
});
