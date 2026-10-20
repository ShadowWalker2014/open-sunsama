import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./auth";

describe("updateProfileSchema timezone", () => {
  it("accepts IANA zones and UTC", () => {
    expect(
      updateProfileSchema.parse({ timezone: "America/New_York" }).timezone
    ).toBe("America/New_York");
    expect(updateProfileSchema.parse({ timezone: "UTC" }).timezone).toBe("UTC");
  });

  it("rejects invalid timezone identifiers", () => {
    expect(() =>
      updateProfileSchema.parse({ timezone: "Not/A_Timezone" })
    ).toThrow("valid IANA timezone");
  });
});
