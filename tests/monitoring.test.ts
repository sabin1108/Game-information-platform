import { describe, expect, it, vi } from "vitest";
import { getDeviceClass } from "@/lib/monitoring/events";

vi.mock("server-only", () => ({}));

async function loadMonitoringRoute() {
  vi.resetModules();

  return import("@/app/api/monitoring/events/route");
}

describe("monitoring", () => {
  it("classifies device width for Web Vitals", () => {
    expect(getDeviceClass(390)).toBe("mobile");
    expect(getDeviceClass(820)).toBe("tablet");
    expect(getDeviceClass(1440)).toBe("desktop");
  });

  it("accepts monitoring events without Sentry settings", async () => {
    vi.stubEnv("SENTRY_DSN", "");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await loadMonitoringRoute();
    const response = await POST(
      new Request("http://localhost:3000/api/monitoring/events", {
        method: "POST",
        body: JSON.stringify({
          type: "client_error",
          message: "boom",
          route: "/"
        })
      })
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("X-API-Status")).toBe("204");
    expect(response.headers.get("X-API-Duration-Ms")).toMatch(/^\d+$/);
    expect(response.headers.get("X-API-Cache")).toBe("none");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
