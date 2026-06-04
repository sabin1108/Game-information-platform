import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const supabaseState = vi.hoisted(() => ({
  runsInsert: vi.fn(),
  runsUpdate: vi.fn(),
  runsEq: vi.fn(),
  snapshotsSelect: vi.fn(),
  insightsInsert: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "ai_insight_runs") {
        return {
          insert: supabaseState.runsInsert,
          update: supabaseState.runsUpdate
        };
      }

      if (table === "price_snapshots") {
        return {
          select: supabaseState.snapshotsSelect
        };
      }

      if (table === "ai_game_insights") {
        return {
          insert: supabaseState.insightsInsert
        };
      }

      throw new Error(`Unexpected table: ${table}`);
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
    supabaseState.runsInsert.mockReset();
    supabaseState.runsUpdate.mockReset();
    supabaseState.runsEq.mockReset();
    supabaseState.snapshotsSelect.mockReset();
    supabaseState.insightsInsert.mockReset();
    supabaseState.runsEq.mockResolvedValue({ error: null });
    supabaseState.runsUpdate.mockReturnValue({ eq: supabaseState.runsEq });
    supabaseState.snapshotsSelect.mockReturnValue({
      order: () => ({
        limit: async () => ({
          data: [],
          error: null
        })
      })
    });
    supabaseState.insightsInsert.mockResolvedValue({ error: null });
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
    expect(supabaseState.runsInsert).not.toHaveBeenCalled();
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
    expect(supabaseState.runsInsert).not.toHaveBeenCalled();
  });

  it("records a run when Supabase admin env is configured", async () => {
    vi.stubEnv("JOB_SECRET", "server-job-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");

    supabaseState.runsInsert.mockReturnValue({
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
    expect(body.job.candidateCount).toBe(0);
    expect(body.job.insightCount).toBe(0);
    expect(supabaseState.runsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_type: "generate_ai_insights",
        status: "running",
        input_window_start: null,
        input_window_end: null
      })
    );
    expect(supabaseState.runsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        error_message: null,
        model_name: null
      })
    );
    expect(supabaseState.runsEq).toHaveBeenCalledWith("id", "run-1");
    expect(supabaseState.insightsInsert).not.toHaveBeenCalled();
  });

  it("saves evidence-backed mock summaries for deterministic candidates", async () => {
    vi.stubEnv("JOB_SECRET", "server-job-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");

    supabaseState.runsInsert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: {
            id: "run-2"
          },
          error: null
        })
      })
    });
    supabaseState.snapshotsSelect.mockReturnValue({
      order: () => ({
        limit: async () => ({
          data: [
            {
              id: "snapshot-1",
              product_id: "product-1",
              country: "KR",
              currency: "KRW",
              regular_price_cents: 32_000,
              current_price_cents: 12_800,
              discount_percent: 60,
              is_historical_low: true,
              observed_at: "2026-06-04T00:00:00.000Z",
              game_store_products: {
                id: "product-1",
                game_id: "game-1",
                store: "steam",
                games: {
                  id: "game-1",
                  title: "Hades II",
                  steam_review_count: 12_000,
                  steam_positive_ratio: 91
                }
              }
            }
          ],
          error: null
        })
      })
    });

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
    expect(body.job.candidateCount).toBeGreaterThanOrEqual(2);
    expect(body.job.insightCount).toBe(body.job.candidateCount);
    expect(supabaseState.insightsInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          run_id: "run-2",
          game_id: "game-1",
          evidence: expect.objectContaining({
            snapshotId: "snapshot-1",
            currentPriceCents: 12_800,
            discountPercent: 60
          })
        })
      ])
    );
    expect(supabaseState.runsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        model_name: "mock-evidence-summarizer-v1"
      })
    );
  });

  it("marks the run failed when insight persistence fails", async () => {
    vi.stubEnv("JOB_SECRET", "server-job-secret");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");

    supabaseState.runsInsert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: {
            id: "run-3"
          },
          error: null
        })
      })
    });
    supabaseState.snapshotsSelect.mockReturnValue({
      order: () => ({
        limit: async () => ({
          data: [
            {
              id: "snapshot-1",
              product_id: "product-1",
              country: "KR",
              currency: "KRW",
              regular_price_cents: 32_000,
              current_price_cents: 12_800,
              discount_percent: 60,
              is_historical_low: true,
              observed_at: "2026-06-04T00:00:00.000Z",
              game_store_products: {
                id: "product-1",
                game_id: "game-1",
                store: "steam",
                games: {
                  id: "game-1",
                  title: "Hades II",
                  steam_review_count: 12_000,
                  steam_positive_ratio: 91
                }
              }
            }
          ],
          error: null
        })
      })
    });
    supabaseState.insightsInsert.mockResolvedValue({
      error: {
        message: "insert failed"
      }
    });

    const { POST } = await loadJobRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/jobs/generate-ai-insights", {
        method: "POST",
        headers: {
          "x-job-secret": "server-job-secret"
        }
      })
    );

    expect(response.status).toBe(500);
    expect(supabaseState.runsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        error_message: "Failed to save AI game insights: insert failed"
      })
    );
  });
});
