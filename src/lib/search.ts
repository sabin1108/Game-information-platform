import "server-only";
import { enrichGameSearchMetadata } from "@/lib/game-artwork";
import { clampNumber, getErrorMessage, withTimeout } from "@/lib/async-utils";
import { isItadConfigured } from "@/lib/env";
import { getItadDeals, searchItadGames } from "@/lib/itad";
import { mockGames } from "@/lib/mock-data";
import {
  collectSearchTagOptions, filterSearchGames, getDiscoveryTagOptions,
  getMeaningfulTags, getSearchTagAliases, normalizeSearchCriteria, titleMatchesQuery,
  type SearchCriteria, type SearchTagOption
} from "@/lib/search-filters";
import {
  getSearchCache, getSearchCacheKey, getStaleSearchCache, normalizeSearchQuery,
  searchCacheConfig, setSearchCache, type SearchCachePayload, type SearchCacheStatus, type SearchSource
} from "@/lib/search-cache";
import type { GameSummary } from "@/types/game";

export type SearchGamesResult = {
  source: SearchSource; query: string; normalized: true; games: GameSummary[]; warning?: string;
  criteria: SearchCriteria; tagOptions: SearchTagOption[]; candidateCount: number; matchedCount: number;
  metadataMissingCount: number; candidateLimit: number;
  cache: { status: SearchCacheStatus; key: string; ttlSeconds: number };
};
export type SearchFilters = {
  country?: string; limit?: number; tag?: string; store?: string;
  maxPrice?: number; discounted?: boolean; sort?: string;
};
const CANDIDATE_LIMIT = 100;
const pendingCandidates = new Map<string, Promise<SearchCachePayload>>();

function fallbackCandidates(query: string): GameSummary[] {
  return mockGames.filter(game => titleMatchesQuery(game.title, query));
}

export async function searchGames(query: string, options: SearchFilters = {}): Promise<SearchGamesResult> {
  const criteria = normalizeSearchCriteria({ q: query, ...options });
  const normalizedQuery = normalizeSearchQuery(criteria.q);
  const country = (options.country ?? "KR").trim().toUpperCase();
  const limit = clampNumber(options.limit, 40, 1, 100);
  const provider: SearchSource = isItadConfigured() ? "itad" : "mock";
  // Local filters share title candidates. Tag-only discovery is filtered by the provider.
  const cacheKey = getSearchCacheKey({ provider, query: normalizedQuery, country, limit: CANDIDATE_LIMIT, tag: normalizedQuery ? undefined : criteria.tag });
  const cached = getSearchCache(cacheKey);
  let payload: SearchCachePayload;
  let status: SearchCacheStatus = "miss";
  let ttlSeconds = searchCacheConfig.ttlSeconds;
  if (cached) {
    payload = cached;
    status = "hit";
    ttlSeconds = cached.ttlSeconds;
  } else {
    let pending = pendingCandidates.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        let loaded: SearchCachePayload;
        if (provider === "itad") {
          try {
            const candidates = normalizedQuery
              ? await withTimeout(searchItadGames(normalizedQuery, { country, results: CANDIDATE_LIMIT }), 7000, "ITAD search timed out.")
              : (await withTimeout(getItadDeals({ country, limit: CANDIDATE_LIMIT, minDiscount: 1, tags: getSearchTagAliases(criteria.tag), allPrices: true }), 7000, "ITAD discovery timed out.")).games;
            const unique = [...new Map(candidates.map(game => [game.id, game])).values()];
            loaded = { source: "itad", query: normalizedQuery, normalized: true, games: await enrichGameSearchMetadata(unique) };
          } catch (error) {
            const stale = getStaleSearchCache(cacheKey);
            if (stale) return { ...stale, warning: getErrorMessage(error, "ITAD request failed.") };
            loaded = { source: "mock", query: normalizedQuery, normalized: true, warning: getErrorMessage(error, "ITAD request failed."), games: fallbackCandidates(normalizedQuery) };
          }
        } else {
          loaded = { source: "mock", query: normalizedQuery, normalized: true, games: fallbackCandidates(normalizedQuery) };
        }
        setSearchCache(cacheKey, loaded);
        return loaded;
      })().finally(() => pendingCandidates.delete(cacheKey));
      pendingCandidates.set(cacheKey, pending);
    }
    payload = await pending;
    if (getStaleSearchCache(cacheKey) && !getSearchCache(cacheKey)) {
      status = "stale";
      ttlSeconds = getStaleSearchCache(cacheKey)!.ttlSeconds;
    }
  }
  const displayCriteria = { ...criteria, discounted: criteria.discounted || !normalizedQuery };
  const filtered = filterSearchGames(payload.games, displayCriteria, !normalizedQuery && payload.source === "itad");
  return {
    source: payload.source, query: payload.query, normalized: true, warning: payload.warning,
    games: filtered.slice(0, limit), criteria,
    tagOptions: normalizedQuery ? collectSearchTagOptions(payload.games) : getDiscoveryTagOptions(),
    candidateCount: payload.games.length, matchedCount: filtered.length,
    metadataMissingCount: payload.games.filter(game => !getMeaningfulTags(game.tags).length).length,
    candidateLimit: CANDIDATE_LIMIT,
    cache: { status, key: cacheKey, ttlSeconds }
  };
}