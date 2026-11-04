import { describe, expect, it } from "vitest";
import { declinedEventClass, isDeclined } from "./declined-event";

describe("isDeclined", () => {
  it("is true only for events the user declined", () => {
    expect(isDeclined({ responseStatus: "declined" })).toBe(true);
    expect(isDeclined({ responseStatus: "accepted" })).toBe(false);
    expect(isDeclined({ responseStatus: "tentative" })).toBe(false);
    expect(isDeclined({ responseStatus: "needsAction" })).toBe(false);
    expect(isDeclined({ responseStatus: null })).toBe(false);
  });
});

describe("declinedEventClass", () => {
  it("fades and strikes through declined events", () => {
    expect(declinedEventClass({ responseStatus: "declined" })).toBe(
      "opacity-50 line-through"
    );
  });

  it("leaves other events unstyled", () => {
    expect(declinedEventClass({ responseStatus: "accepted" })).toBeUndefined();
  });
});
