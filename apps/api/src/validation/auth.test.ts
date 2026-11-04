import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./auth";
import { preserveTimezoneManuallySet } from "../routes/auth";

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

describe("preserveTimezoneManuallySet", () => {
  it("keeps the manual timezone marker when a client updates theme preferences", () => {
    expect(
      preserveTimezoneManuallySet(
        { themeMode: "dark", colorTheme: "blue", fontFamily: "inter" },
        true,
      ),
    ).toMatchObject({ timezoneManuallySet: true });
  });
});
