import { NextResponse, type NextRequest } from "next/server";

type RateLimitConfig = {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = process.env.NODE_ENV === "development" ? 240 : 120;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getPublicApiRateLimitConfig(): RateLimitConfig {
  return {
    enabled: process.env.PUBLIC_API_RATE_LIMIT_ENABLED !== "false",
    maxRequests: readPositiveInteger(
      process.env.PUBLIC_API_RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_MAX_REQUESTS
    ),
    windowMs: readPositiveInteger(
      process.env.PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_WINDOW_SECONDS
    ) * 1000
  };
}

export function getRateLimitIdentity(request: NextRequest | Request) {
  const cookieId =
    "cookies" in request && typeof request.cookies?.get === "function"
      ? request.cookies.get("gdw_anonymous_id")?.value
      : undefined;

  if (cookieId) {
    return `anon:${cookieId}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return `ip:${forwardedFor || realIp || "local-dev"}`;
}

export function createMemoryRateLimiter(now: () => number = () => Date.now()) {
  const buckets = new Map<string, RateLimitBucket>();

  return {
    check(key: string, config: RateLimitConfig): RateLimitResult {
      const currentTime = now();
      const windowMs = Math.max(1000, config.windowMs);
      const limit = Math.max(1, config.maxRequests);

      if (!config.enabled) {
        return {
          allowed: true,
          limit,
          remaining: limit,
          resetAt: currentTime + windowMs,
          retryAfterSeconds: 0
        };
      }

      const existing = buckets.get(key);
      const bucket =
        existing && existing.resetAt > currentTime
          ? existing
          : {
              count: 0,
              resetAt: currentTime + windowMs
            };

      if (bucket.count >= limit) {
        buckets.set(key, bucket);

        return {
          allowed: false,
          limit,
          remaining: 0,
          resetAt: bucket.resetAt,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))
        };
      }

      bucket.count += 1;
      buckets.set(key, bucket);

      return {
        allowed: true,
        limit,
        remaining: Math.max(0, limit - bucket.count),
        resetAt: bucket.resetAt,
        retryAfterSeconds: 0
      };
    },
    clear() {
      buckets.clear();
    }
  };
}

const publicApiRateLimiter = createMemoryRateLimiter();

function rateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": new Date(result.resetAt).toISOString(),
    "Retry-After": String(result.retryAfterSeconds)
  };
}

export function publicApiRateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: "Rate limit exceeded.",
      rateLimit: {
        limit: result.limit,
        remaining: result.remaining,
        retryAfterSeconds: result.retryAfterSeconds,
        resetAt: new Date(result.resetAt).toISOString()
      }
    },
    {
      status: 429,
      headers: rateLimitHeaders(result)
    }
  );
}

export function applyPublicApiRateLimit(request: NextRequest, route: string) {
  const config = getPublicApiRateLimitConfig();
  const identity = getRateLimitIdentity(request);
  const result = publicApiRateLimiter.check(`${route}:${identity}`, config);

  if (result.allowed) {
    return null;
  }

  return publicApiRateLimitResponse(result);
}

export function clearPublicApiRateLimitForTests() {
  publicApiRateLimiter.clear();
}
