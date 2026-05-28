import type { StoreCode } from "@/types/game";
import type { GameFeed } from "@/lib/game-feeds";

const DEAL_CACHE_TTL_MS = 5 * 60 * 1000;
const DEAL_CACHE_MAX_ENTRIES = 80;

export type DealSort = "discount" | "price" | "reviews";
export type DealCacheStatus = "hit" | "miss";

export type DealFilterState = {
  country: string;
  limit: number;
  minDiscount: number;
  maxPriceCents?: number;
  store?: StoreCode;
  sort: DealSort;
};

type DealCacheEntry = GameFeed & {
  expiresAt: number;
};

const dealCache = new Map<string, DealCacheEntry>();

export function getDealCacheKey(provider: GameFeed["source"], filters: DealFilterState) {
  return [
    provider,
    filters.country,
    String(filters.limit),
    String(filters.minDiscount),
    String(filters.maxPriceCents ?? "any"),
    filters.store ?? "all",
    filters.sort
  ].join(":");
}

export function getDealCache(key: string, now = Date.now()) {
  const entry = dealCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now) {
    dealCache.delete(key);
    return null;
  }

  dealCache.delete(key);
  dealCache.set(key, entry);

  return {
    source: entry.source,
    games: entry.games,
    warning: entry.warning,
    ttlSeconds: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000))
  };
}

export function setDealCache(key: string, payload: GameFeed, now = Date.now()) {
  dealCache.set(key, {
    ...payload,
    expiresAt: now + DEAL_CACHE_TTL_MS
  });

  while (dealCache.size > DEAL_CACHE_MAX_ENTRIES) {
    const oldestKey = dealCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    dealCache.delete(oldestKey);
  }
}

export function clearDealCacheForTests() {
  dealCache.clear();
}

export const dealCacheConfig = {
  ttlSeconds: DEAL_CACHE_TTL_MS / 1000,
  maxEntries: DEAL_CACHE_MAX_ENTRIES
};
