import type { GameFeed } from "@/lib/game-feeds";

const POPULAR_CACHE_TTL_MS = 5 * 60 * 1000;
const POPULAR_CACHE_STALE_TTL_MS = 6 * 60 * 60 * 1000;
const POPULAR_CACHE_MAX_ENTRIES = 40;
const POPULAR_CACHE_SCHEMA_VERSION = "v1";

export type PopularCacheStatus = "hit" | "miss" | "stale";

type PopularCacheEntry = GameFeed & {
  expiresAt: number;
  staleUntil: number;
};

const popularCache = new Map<string, PopularCacheEntry>();

export function getPopularCacheKey(provider: GameFeed["source"], options: {
  country: string;
  limit: number;
}) {
  return [
    POPULAR_CACHE_SCHEMA_VERSION,
    provider,
    options.country.trim().toUpperCase(),
    String(options.limit)
  ].join(":");
}

export function getPopularCache(key: string, now = Date.now()) {
  const entry = popularCache.get(key);

  if (!entry || entry.expiresAt <= now) {
    return null;
  }

  popularCache.delete(key);
  popularCache.set(key, entry);

  return {
    source: entry.source,
    games: entry.games,
    warning: entry.warning,
    ttlSeconds: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000))
  };
}

export function getStalePopularCache(key: string, now = Date.now()) {
  const entry = popularCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.staleUntil <= now) {
    popularCache.delete(key);
    return null;
  }

  popularCache.delete(key);
  popularCache.set(key, entry);

  return {
    source: entry.source,
    games: entry.games,
    warning: entry.warning,
    ttlSeconds: Math.max(0, Math.ceil((entry.staleUntil - now) / 1000))
  };
}

export function setPopularCache(key: string, payload: GameFeed, now = Date.now()) {
  popularCache.set(key, {
    ...payload,
    expiresAt: now + POPULAR_CACHE_TTL_MS,
    staleUntil: now + POPULAR_CACHE_STALE_TTL_MS
  });

  while (popularCache.size > POPULAR_CACHE_MAX_ENTRIES) {
    const oldestKey = popularCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    popularCache.delete(oldestKey);
  }
}

export function clearPopularCacheForTests() {
  popularCache.clear();
}

export const popularCacheConfig = {
  ttlSeconds: POPULAR_CACHE_TTL_MS / 1000,
  staleTtlSeconds: POPULAR_CACHE_STALE_TTL_MS / 1000,
  maxEntries: POPULAR_CACHE_MAX_ENTRIES
};
