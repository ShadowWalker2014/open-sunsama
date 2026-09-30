import { afterEach, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "./encryption";

const originalCalendarKey = process.env.CALENDAR_ENCRYPTION_KEY;
const originalKey = process.env.ENCRYPTION_KEY;

afterEach(() => {
  if (originalCalendarKey === undefined) delete process.env.CALENDAR_ENCRYPTION_KEY;
  else process.env.CALENDAR_ENCRYPTION_KEY = originalCalendarKey;
  if (originalKey === undefined) delete process.env.ENCRYPTION_KEY;
  else process.env.ENCRYPTION_KEY = originalKey;
});

describe("shared credential encryption", () => {
  it("keeps decrypting calendar tokens when a different integration key is configured", () => {
    process.env.CALENDAR_ENCRYPTION_KEY = "ab".repeat(32);
    delete process.env.ENCRYPTION_KEY;
    const encrypted = encrypt("saved calendar credential");

    process.env.ENCRYPTION_KEY = "cd".repeat(32);
    expect(decrypt(encrypted)).toBe("saved calendar credential");
    expect(decrypt(encrypt("new integration credential"))).toBe("new integration credential");
  });
});
