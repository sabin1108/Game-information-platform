import type { GameFeed } from "@/lib/game-feeds";
import { getFreshCacheEntry, getStaleCacheEntry, trimOldestCacheEntries } from "@/lib/stale-cache";

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

function toPopularCachePayload(entry: PopularCacheEntry, ttlSeconds: number) {
  return {
    source: entry.source,
    games: entry.games,
    warning: entry.warning,
    ttlSeconds
  };
}

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
  const cached = getFreshCacheEntry(popularCache, key, now);

  return cached ? toPopularCachePayload(cached.entry, cached.ttlSeconds) : null;
}

export function getStalePopularCache(key: string, now = Date.now()) {
  const cached = getStaleCacheEntry(popularCache, key, now);

  return cached ? toPopularCachePayload(cached.entry, cached.ttlSeconds) : null;
}

export function setPopularCache(key: string, payload: GameFeed, now = Date.now()) {
  popularCache.set(key, {
    ...payload,
    expiresAt: now + POPULAR_CACHE_TTL_MS,
    staleUntil: now + POPULAR_CACHE_STALE_TTL_MS
  });

  trimOldestCacheEntries(popularCache, POPULAR_CACHE_MAX_ENTRIES);
}

export function clearPopularCacheForTests() {
  popularCache.clear();
}

export const popularCacheConfig = {
  ttlSeconds: POPULAR_CACHE_TTL_MS / 1000,
  staleTtlSeconds: POPULAR_CACHE_STALE_TTL_MS / 1000,
  maxEntries: POPULAR_CACHE_MAX_ENTRIES
};
