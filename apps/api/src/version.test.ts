import { describe, expect, it } from "vitest";
import packageJson from "../package.json";
import { APP_VERSION } from "./version.js";

describe("APP_VERSION", () => {
  it("uses the API package version instead of npm lifecycle environment state", () => {
    process.env.npm_package_version = "0.0.0-test";

    expect(APP_VERSION).toBe(packageJson.version);
    expect(APP_VERSION).not.toBe(process.env.npm_package_version);
  });
});
