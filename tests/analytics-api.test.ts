import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

async function loadAnalyticsRoute() {
  vi.resetModules();

  return import("@/app/api/analytics/events/route");
}

describe("analytics API route", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("succeeds without PostHog settings", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_TOKEN", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadAnalyticsRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          event: "deal_click",
          distinctId: "anonymous-1",
          properties: {
            game_id: "hades-ii"
          }
        })
      })
    );

    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unknown analytics events", async () => {
    const { POST } = await loadAnalyticsRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          event: "unknown_event",
          distinctId: "anonymous-1"
        })
      })
    );

    expect(response.status).toBe(400);
  });

  it("forwards supported analytics payload shapes", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_TOKEN", "ph-test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://posthog.example");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadAnalyticsRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/analytics/events", {
        method: "POST",
        body: JSON.stringify({
          event: "search_submitted",
          distinctId: "anonymous-1",
          properties: {
            query: "hades",
            tag: "roguelike",
            source: "search-page"
          }
        })
      })
    );

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://posthog.example/capture/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          api_key: "ph-test",
          event: "search_submitted",
          distinct_id: "anonymous-1",
          properties: {
            query: "hades",
            tag: "roguelike",
            source: "search-page"
          }
        })
      })
    );
  });
});
