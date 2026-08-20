import type { StoreCode } from "@/types/game";
import type { GameFeed } from "@/lib/game-feeds";
import { getFreshCacheEntry, getStaleCacheEntry, trimOldestCacheEntries } from "@/lib/stale-cache";

const DEAL_CACHE_TTL_MS = 5 * 60 * 1000;
const DEAL_CACHE_STALE_TTL_MS = 6 * 60 * 60 * 1000;
const DEAL_CACHE_MAX_ENTRIES = 80;
const DEAL_CACHE_SCHEMA_VERSION = "v11";
export type DealSort = "discount" | "price" | "reviews";
export type DealCacheStatus = "hit" | "miss" | "stale";

export type DealFilterState = {
  country: string;
  offset: number;
  limit: number;
  minDiscount: number;
  maxPriceCents?: number;
  store?: StoreCode;
  tag?: string;
  sort: DealSort;
};

type DealCacheEntry = GameFeed & {
  expiresAt: number;
  staleUntil: number;
};

const dealCache = new Map<string, DealCacheEntry>();

function toDealCachePayload(entry: DealCacheEntry, ttlSeconds: number) {
  return {
    source: entry.source,
    games: entry.games,
    warning: entry.warning,
    nextOffset: entry.nextOffset,
    hasMore: entry.hasMore,
    tagOptions: entry.tagOptions,
    ttlSeconds
  };
}

export function getDealCacheKey(provider: GameFeed["source"], filters: DealFilterState) {
  return [
    DEAL_CACHE_SCHEMA_VERSION,
    provider,
    filters.country,
    String(filters.offset),
    String(filters.limit),
    String(filters.minDiscount),
    String(filters.maxPriceCents ?? "any"),
    filters.store ?? "all",
    filters.tag ?? "all",
    filters.sort
  ].join(":");
}

export function getDealCache(key: string, now = Date.now()) {
  const cached = getFreshCacheEntry(dealCache, key, now);

  return cached ? toDealCachePayload(cached.entry, cached.ttlSeconds) : null;
}

export function getStaleDealCache(key: string, now = Date.now()) {
  const cached = getStaleCacheEntry(dealCache, key, now);

  return cached ? toDealCachePayload(cached.entry, cached.ttlSeconds) : null;
}

export function setDealCache(key: string, payload: GameFeed, now = Date.now()) {
  dealCache.set(key, {
    ...payload,
    expiresAt: now + DEAL_CACHE_TTL_MS,
    staleUntil: now + DEAL_CACHE_STALE_TTL_MS
  });

  trimOldestCacheEntries(dealCache, DEAL_CACHE_MAX_ENTRIES);
}

export function clearDealCacheForTests() {
  dealCache.clear();
}

export const dealCacheConfig = {
  ttlSeconds: DEAL_CACHE_TTL_MS / 1000,
  staleTtlSeconds: DEAL_CACHE_STALE_TTL_MS / 1000,
  maxEntries: DEAL_CACHE_MAX_ENTRIES
};
