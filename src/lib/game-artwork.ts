import "server-only";
import { getItadGameInfo } from "@/lib/itad";
import { getItadImageUrl, getSteamHeaderImageUrl } from "@/lib/itad-normalizers";
import { getMeaningfulTags } from "@/lib/search-filters";
import { trimOldestCacheEntries } from "@/lib/stale-cache";
import type { GameSummary } from "@/types/game";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const RETRY_TTL = 60 * 1000;
const LOOKUP_BUDGET = 4000;
type GameDetails = { url: string; tags?: string[]; steamAppId?: number };
const detailsCache = new Map<string, GameDetails & { expiresAt: number }>();
const pending = new Map<string, Promise<GameDetails>>();

function getDetails(id: string, timeoutMs: number): Promise<GameDetails> {
  const cached = detailsCache.get(id);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached);
  const existing = pending.get(id);
  if (existing) return existing;
  const request = (async () => {
    let details: GameDetails = cached ?? { url: "" };
    let refreshed = false;
    try {
      const info = await getItadGameInfo(id, timeoutMs);
      if (info.id === id) {
        const steamAppId = typeof info.appid === "number" && Number.isSafeInteger(info.appid) && info.appid > 0 ? info.appid : undefined;
        const candidate = getItadImageUrl(info.assets) || getSteamHeaderImageUrl(steamAppId);
        const url = candidate && new URL(candidate).protocol === "https:" ? candidate : details.url;
        const tags = Array.isArray(info.tags) ? getMeaningfulTags(info.tags.filter((tag): tag is string => typeof tag === "string")) : details.tags;
        details = { url, tags, steamAppId };
        refreshed = Boolean(url || tags);
      }
    } catch {
      // Keep stale metadata; one failed lookup must not discard usable games.
    }
    detailsCache.set(id, { ...details, expiresAt: Date.now() + (refreshed ? CACHE_TTL : RETRY_TTL) });
    trimOldestCacheEntries(detailsCache, 1000);
    return details;
  })().finally(() => pending.delete(id));
  pending.set(id, request);
  return request;
}

async function enrichDetails(games: GameSummary[], includeTags: boolean): Promise<GameSummary[]> {
  const result = includeTags ? games.map(game => ({ ...game, tags: getMeaningfulTags(game.tags) })) : [...games];
  const missing = result.map((game, index) => ({ game, index }))
    .filter(({ game }) => UUID.test(game.id) && (!game.imageUrl?.trim() || (includeTags && !game.tags.length)));
  const deadline = Date.now() + LOOKUP_BUDGET;
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, missing.length) }, async () => {
    while (cursor < missing.length) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      const { game, index } = missing[cursor++];
      const details = await getDetails(game.id, Math.min(2500, remaining));
      result[index] = {
        ...game,
        imageUrl: game.imageUrl?.trim() || details.url,
        ...(includeTags ? { tags: details.tags ?? game.tags, steamAppId: game.steamAppId ?? details.steamAppId } : {})
      };
    }
  }));
  return result;
}

/** Artwork and search tags share exact-ID lookups, TTL and concurrent requests. */
export function enrichGameArtwork(games: GameSummary[]): Promise<GameSummary[]> {
  return enrichDetails(games, false);
}
export function enrichGameSearchMetadata(games: GameSummary[]): Promise<GameSummary[]> {
  return enrichDetails(games, true);
}