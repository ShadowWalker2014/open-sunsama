import { expect, it } from "vitest";

// Deliberately failing: proves CI blocks merging. This PR is closed, never merged.
it("fails on purpose", () => {
  expect(1).toBe(2);
});
