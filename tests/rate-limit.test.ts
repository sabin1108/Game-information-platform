import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  createMemoryRateLimiter,
  getRateLimitIdentity,
  publicApiRateLimitResponse
} from "@/lib/rate-limit";

describe("public API rate limiter", () => {
  it("allows requests until the fixed window limit is reached", () => {
    let now = 1_000;
    const limiter = createMemoryRateLimiter(() => now);
    const config = {
      enabled: true,
      maxRequests: 2,
      windowMs: 10_000
    };

    expect(limiter.check("route:ip:127.0.0.1", config)).toMatchObject({
      allowed: true,
      remaining: 1
    });
    expect(limiter.check("route:ip:127.0.0.1", config)).toMatchObject({
      allowed: true,
      remaining: 0
    });
    expect(limiter.check("route:ip:127.0.0.1", config)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 10
    });

    now = 11_001;

    expect(limiter.check("route:ip:127.0.0.1", config)).toMatchObject({
      allowed: true,
      remaining: 1
    });
  });

  it("uses anonymous id cookies before IP headers", () => {
    const request = new NextRequest("http://localhost:3000/api/search", {
      headers: {
        cookie: "gdw_anonymous_id=session-1",
        "x-forwarded-for": "203.0.113.10"
      }
    });

    expect(getRateLimitIdentity(request)).toBe("anon:session-1");
  });

  it("returns retry metadata on 429 responses", async () => {
    const response = publicApiRateLimitResponse({
      allowed: false,
      limit: 2,
      remaining: 0,
      resetAt: Date.parse("2026-06-05T00:00:10.000Z"),
      retryAfterSeconds: 10
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("10");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(body).toMatchObject({
      error: "Rate limit exceeded.",
      rateLimit: {
        limit: 2,
        remaining: 0,
        retryAfterSeconds: 10
      }
    });
  });
});
