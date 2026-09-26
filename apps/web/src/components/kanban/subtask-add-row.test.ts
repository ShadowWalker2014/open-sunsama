import { describe, expect, it } from "vitest";
import { parseSubtaskTitles } from "./subtask-add-row";

describe("parseSubtaskTitles", () => {
  it("splits lines and drops blanks", () => {
    expect(parseSubtaskTitles("One\n\n  Two  \r\nThree\n")).toEqual([
      "One",
      "Two",
      "Three",
    ]);
  });

  it("strips bullet, checkbox and number markers", () => {
    expect(
      parseSubtaskTitles("- [ ] Buy milk\n* Call Sam\n• Book\n1. First\n2) Second\n[x] Done")
    ).toEqual(["Buy milk", "Call Sam", "Book", "First", "Second", "Done"]);
  });

  it("keeps text that only looks like a marker mid-line", () => {
    expect(parseSubtaskTitles("Fix bug - urgent\nRelease 2.0")).toEqual([
      "Fix bug - urgent",
      "Release 2.0",
    ]);
  });
});
