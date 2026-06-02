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
});
