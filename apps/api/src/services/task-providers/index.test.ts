import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  getTaskProvider,
  hasTaskProvider,
  listTaskProviders,
  registerTaskProvider,
  type TaskProvider,
} from "./index";

describe("task-provider registry", () => {
  it("starts empty and accepts an independent provider without schema changes", () => {
    expect(listTaskProviders()).toEqual([]);
    const provider: TaskProvider = {
      id: "example",
      displayName: "Example",
      docsUrl: "https://example.com/docs",
      credentialFields: [],
      credentialSchema: z.object({ token: z.string() }),
      referenceExample: "https://example.com/tasks/123",
      async verifyCredentials(credentials) {
        return { providerAccountId: "123", label: "Example", credentials };
      },
      parseReference: (input) => input.startsWith("example:") ? input.slice(8) : null,
      async fetchTask() { throw new Error("Not needed for registry test"); },
    };

    registerTaskProvider(provider);
    expect(hasTaskProvider("example")).toBe(true);
    expect(getTaskProvider("example")).toBe(provider);
    expect(() => registerTaskProvider(provider)).toThrow(/duplicate/);
    expect(hasTaskProvider("missing")).toBe(false);
    expect(() => getTaskProvider("missing")).toThrow(/not found/);
  });
});
