import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const supabaseState = vi.hoisted(() => ({
  insert: vi.fn(),
  update: vi.fn(),
  eq: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "ai_insight_runs") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        insert: supabaseState.insert,
        update: supabaseState.update
      };
    }
  })
}));

async function loadJobRoute() {
  vi.resetModules();

  return import("@/app/api/jobs/generate-ai-insights/route");
}

describe("generate AI insights job route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    supabaseState.insert.mockReset();
    supabaseState.update.mockReset();
    supabaseState.eq.mockReset();
    supabaseState.eq.mockResolvedValue({ error: null });
    supabaseState.update.mockReturnValue({ eq: supabaseState.eq });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects requests without the job secret", async () => {
    vi.stubEnv("JOB_SECRET", "server-job-secret");

    const { POST } = await loadJobRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/jobs/generate-ai-insights", {
        method: "POST"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get("X-API-Status")).toBe("401");
    expect(body.error).toBe("Unauthorized job request.");
    expect(supabaseState.insert).not.toHaveBeenCalled();
  });

  it("executes a dry-run when Supabase admin env is missing", async () => {
    vi.stubEnv("JOB_SECRET", "server-job-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { POST } = await loadJobRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/jobs/generate-ai-insights", {
        method: "POST",
        headers: {
          "x-job-secret": "server-job-secret"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Job-Status")).toBe("succeeded");
    expect(body.job).toMatchObject({
      runId: null,
      jobType: "generate_ai_insights",
      status: "succeeded",
      candidateCount: 0,
      insightCount: 0,
      dryRun: true
    });
    expect(supabaseState.insert).not.toHaveBeenCalled();
  });

  it("records a run when Supabase admin env is configured", async () => {
    vi.stubEnv("JOB_SECRET", "server-job-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");

    supabaseState.insert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: {
            id: "run-1"
          },
          error: null
        })
      })
    });

    const { POST } = await loadJobRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/jobs/generate-ai-insights", {
        method: "POST",
        headers: {
          authorization: "Bearer server-job-secret"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.job).toMatchObject({
      runId: "run-1",
      status: "succeeded",
      dryRun: false
    });
    expect(JSON.stringify(body)).not.toContain("server-job-secret");
    expect(JSON.stringify(body)).not.toContain("service-role-secret");
    expect(supabaseState.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_type: "generate_ai_insights",
        status: "running",
        input_window_start: null,
        input_window_end: null
      })
    );
    expect(supabaseState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        error_message: null
      })
    );
    expect(supabaseState.eq).toHaveBeenCalledWith("id", "run-1");
  });
});
