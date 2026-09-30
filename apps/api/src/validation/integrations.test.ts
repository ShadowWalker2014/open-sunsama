import { describe, expect, it } from "vitest";
import {
  createIntegrationAccountSchema,
  createTaskLinkSchema,
  linkIdParamSchema,
  taskIdParamSchema,
} from "./integrations";

describe("integration route validation", () => {
  it("accepts arbitrary provider ids and credential fields", () => {
    expect(createIntegrationAccountSchema.parse({
      provider: "example",
      credentials: { token: "sample", workspace: "team" },
    }).provider).toBe("example");
  });

  it("rejects invalid link and task ids before querying Postgres", () => {
    expect(linkIdParamSchema.safeParse({ linkId: "not-a-uuid" }).success).toBe(false);
    expect(taskIdParamSchema.safeParse({ taskId: "not-a-uuid" }).success).toBe(false);
  });

  it("allows provider-defined object kinds", () => {
    expect(createTaskLinkSchema.parse({
      provider: "example",
      externalId: "123",
      externalUrl: "https://example.com/123",
      kind: "incident",
    }).kind).toBe("incident");
  });
});
