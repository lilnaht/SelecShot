import { describe, expect, it } from "vitest";

import {
  isUuid,
  sanitizeDisplayName,
  sanitizeRedirectPath,
} from "@/lib/security";

describe("security helpers", () => {
  it("allows only internal dashboard/account redirects", () => {
    expect(sanitizeRedirectPath("/dashboard/analyses/123")).toBe(
      "/dashboard/analyses/123"
    );
    expect(sanitizeRedirectPath("/account")).toBe("/account");
    expect(sanitizeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.example/path")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/pricing")).toBe("/dashboard");
  });

  it("validates UUIDs", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUuid("mock-analysis-1")).toBe(false);
  });

  it("normalizes display names without HTML brackets", () => {
    expect(sanitizeDisplayName("  <Ana>   Silva  ")).toBe("Ana Silva");
  });
});
