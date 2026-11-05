import { describe, expect, it } from "vitest";
import { blockTooltip } from "./time-block";

describe("blockTooltip", () => {
  it("shows the title, then the start and end time", () => {
    expect(
      blockTooltip("Write report", new Date(2026, 9, 26, 9, 0), new Date(2026, 9, 26, 10, 30))
    ).toBe("Write report\n9:00 AM – 10:30 AM");
  });

  it("uses PM for afternoon blocks", () => {
    expect(
      blockTooltip("Chores", new Date(2026, 9, 26, 19, 0), new Date(2026, 9, 26, 19, 30))
    ).toBe("Chores\n7:00 PM – 7:30 PM");
  });
});
