import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const supabaseState = vi.hoisted(() => ({
  insightsSelect: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table !== "ai_game_insights") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: supabaseState.insightsSelect
      };
    }
  })
}));

async function loadInsightsRoute() {
  vi.resetModules();

  return import("@/app/api/insights/route");
}

describe("insights API route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    supabaseState.insightsSelect.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a stable empty feed without Supabase admin env", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    const { GET } = await loadInsightsRoute();
    const response = await GET(new NextRequest("http://localhost:3000/api/insights"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(supabaseState.insightsSelect).not.toHaveBeenCalled();
  });

  it("serves evidence-backed insights and marks stale snapshots", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-secret");
    supabaseState.insightsSelect.mockReturnValue({
      order: () => ({
        limit: async () => ({
          data: [
            {
              id: "insight-1",
              run_id: "run-1",
              game_id: "game-1",
              insight_type: "deep_discount",
              title: "Hades II deep discount",
              summary: "High review discount backed by stored evidence.",
              evidence: {
                title: "Hades II",
                store: "steam",
                country: "KR",
                currency: "KRW",
                regularPriceCents: 32_000,
                currentPriceCents: 12_800,
                discountPercent: 60,
                observedAt: "2020-01-01T00:00:00.000Z",
                steamReviewCount: 12_000,
                steamPositiveRatio: 91
              },
              confidence: 0.92,
              created_at: "2026-06-04T01:00:00.000Z",
              games: {
                title: "Hades II"
              },
              ai_insight_runs: {
                status: "succeeded",
                completed_at: "2026-06-04T01:01:00.000Z"
              }
            }
          ],
          error: null
        })
      })
    });

    const { GET } = await loadInsightsRoute();
    const response = await GET(new NextRequest("http://localhost:3000/api/insights?limit=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("X-Insights-Cache")).toBe("miss");
    expect(JSON.stringify(body)).not.toContain("service-role-secret");
    expect(body.data[0]).toMatchObject({
      id: "insight-1",
      gameTitle: "Hades II",
      isStale: true,
      evidenceLabel: expect.stringContaining("-60%")
    });
    expect(body.data[0].evidenceLabel).not.toContain("12,800원");
  });
});
