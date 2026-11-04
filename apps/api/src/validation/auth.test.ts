import { describe, expect, it } from "vitest";
import { updateProfileSchema, userPreferencesSchema } from "./auth";
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

const preferences = { themeMode: "system", colorTheme: "default", fontFamily: "geist" };

describe("userPreferencesSchema", () => {
  it("keeps showProjectedTasks, which would otherwise be dropped and reset on reload", () => {
    expect(
      userPreferencesSchema.parse({ ...preferences, showProjectedTasks: false })
        .showProjectedTasks
    ).toBe(false);
  });

  it("leaves showProjectedTasks unset when it isn't sent", () => {
    expect(userPreferencesSchema.parse(preferences).showProjectedTasks).toBeUndefined();
  });

  it("rejects a showProjectedTasks that isn't a boolean", () => {
    expect(
      userPreferencesSchema.safeParse({ ...preferences, showProjectedTasks: "no" }).success
    ).toBe(false);
  });
});
