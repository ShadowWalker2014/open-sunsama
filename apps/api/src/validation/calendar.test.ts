import { describe, expect, it } from "vitest";
import { oauthInitiateQuerySchema } from "./calendar.js";

describe("oauthInitiateQuerySchema", () => {
  it("accepts an absent or valid reconnect account ID", () => {
    expect(oauthInitiateQuerySchema.safeParse({}).success).toBe(true);
    expect(
      oauthInitiateQuerySchema.safeParse({
        accountId: "c0a8012e-1234-4abc-8def-123456789abc",
      }).success
    ).toBe(true);
  });

  it("rejects malformed reconnect account IDs", () => {
    expect(
      oauthInitiateQuerySchema.safeParse({ accountId: "not-an-account" })
        .success
    ).toBe(false);
  });
});
