import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const createSupabaseServerClient = vi.fn();
const createSupabaseAdminClient = vi.fn();
const processSupabaseAnalysis = vi.fn();
const logAuditEvent = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getCurrentUser,
  createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/image-analysis/process-supabase-analysis", () => ({
  processSupabaseAnalysis,
}));

vi.mock("@/lib/audit", () => ({
  logAuditEvent,
}));

function request(body: unknown) {
  return new NextRequest("https://app.example.test/api/worker/trigger", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://app.example.test",
      "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 200)}`,
    },
    body: JSON.stringify(body),
  });
}

function supabaseForAnalysis(status: string) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "550e8400-e29b-41d4-a716-446655440000",
                user_id: "user-1",
                status,
              },
              error: null,
            })),
          })),
        })),
      })),
    })),
  };
}

describe("worker trigger route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getCurrentUser.mockResolvedValue({ id: "user-1" });
    createSupabaseAdminClient.mockReturnValue({});
    processSupabaseAnalysis.mockResolvedValue({ status: "processed" });
  });

  it("rejects invalid analysis ids", async () => {
    const { POST } = await import("./route");
    const response = await POST(request({ analysis_id: "bad-id" }));

    expect(response.status).toBe(400);
    expect(processSupabaseAnalysis).not.toHaveBeenCalled();
  });

  it("requires retry=true for failed analyses", async () => {
    createSupabaseServerClient.mockResolvedValue(supabaseForAnalysis("failed"));
    const { POST } = await import("./route");
    const response = await POST(
      request({ analysis_id: "550e8400-e29b-41d4-a716-446655440000" })
    );

    expect(response.status).toBe(409);
    expect(processSupabaseAnalysis).not.toHaveBeenCalled();
  });

  it("passes retry requests to the processor", async () => {
    createSupabaseServerClient.mockResolvedValue(supabaseForAnalysis("failed"));
    const { POST } = await import("./route");
    const response = await POST(
      request({
        analysis_id: "550e8400-e29b-41d4-a716-446655440000",
        retry: true,
      })
    );

    expect(response.status).toBe(200);
    expect(processSupabaseAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        analysisId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "user-1",
        retry: true,
      })
    );
    expect(logAuditEvent).toHaveBeenCalled();
  });
});
