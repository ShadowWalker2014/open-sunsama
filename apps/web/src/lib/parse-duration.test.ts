import { describe, expect, it } from "vitest";
import {
  describeDuration,
  isZeroDuration,
  parseDuration,
} from "./parse-duration";

describe("parseDuration", () => {
  it.each([
    ["45", 45],
    ["45m", 45],
    ["45 min", 45],
    ["45 minutes", 45],
    [" 45 ", 45],
    ["130", 130],
    ["1:15", 75],
    ["0:20", 20],
    ["01:05", 65],
    ["1:00", 60],
    ["2h", 120],
    ["2 hr", 120],
    ["2 hours", 120],
    ["1.5h", 90],
    ["1h30", 90],
    ["1h 30m", 90],
    ["1H30M", 90],
    ["1.5", 90],
    [".5", 30],
    ["0.25", 15],
    ["24:00", 1440],
    ["1440", 1440],
  ])("reads %s as %i minutes", (input, mins) => {
    expect(parseDuration(input)).toBe(mins);
  });

  it.each([
    "",
    "   ",
    "abc",
    "0",
    "0:00",
    "-5",
    "1:xx",
    "1:75",
    "1:5",
    ":30",
    "1:",
    "1h75",
    "24:01",
    "1441",
    "25h",
    "99999999",
    "1.2.3",
    "1e3",
    "5 days",
  ])("rejects %j", (input) => {
    expect(parseDuration(input)).toBeNull();
  });
});

describe("isZeroDuration", () => {
  it.each(["0", "00", "0:00", " 0:0 "])("treats %j as clear", (input) => {
    expect(isZeroDuration(input)).toBe(true);
  });
  it.each(["", "10", "0:05", "abc"])("does not treat %j as clear", (input) => {
    expect(isZeroDuration(input)).toBe(false);
  });
});

describe("describeDuration", () => {
  it.each([
    [5, "5 min"],
    [60, "1 hr"],
    [90, "1 hr 30 min"],
    [1440, "24 hr"],
  ])("describes %i as %s", (mins, text) => {
    expect(describeDuration(mins)).toBe(text);
  });
});
