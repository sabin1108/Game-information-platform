import type { GameSummary, WatchlistItem } from "@/types/game";

export type RecommendationSeed = {
  tags: string[];
  searches?: string[];
};

const ignoredRecommendationTags = new Set([
  "game",
  "games",
  "package",
  "dlc",
  "demo",
  "software",
  "action",
  "adventure",
  "indie",
  "singleplayer",
  "multiplayer"
]);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizeRecommendationTag(value: string) {
  const normalized = normalize(value);

  return normalized && !ignoredRecommendationTags.has(normalized) ? normalized : "";
}

function addWeight(weights: Map<string, number>, key: string, value: number) {
  const normalized = normalizeRecommendationTag(key);

  if (normalized) {
    weights.set(normalized, (weights.get(normalized) ?? 0) + value);
  }
}

function isTagMatch(candidateTag: string, seedTag: string) {
  const candidate = normalizeRecommendationTag(candidateTag);

  if (!candidate) {
    return false;
  }

  if (candidate === seedTag) {
    return true;
  }

  if (seedTag === "rpg" && candidate.endsWith("rpg")) {
    return true;
  }

  return candidate.length >= 4 && seedTag.length >= 4 && (
    candidate.includes(seedTag) || seedTag.includes(candidate)
  );
}

export function getRecommendationSeed(watchlist: WatchlistItem[], searches: string[] = []): RecommendationSeed {
  const weights = new Map<string, number>();

  for (const item of watchlist) {
    for (const tag of item.game.tags) {
      addWeight(weights, tag, 3);
    }
  }

  for (const search of searches) {
    addWeight(weights, search, 1);
  }

  return {
    tags: [...weights.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag),
    searches
  };
}

export function recommendGames(games: GameSummary[], watchlist: WatchlistItem[], searches: string[] = [], limit = 12) {
  const seed = getRecommendationSeed(watchlist, searches);
  const watchedIds = new Set(watchlist.map((item) => item.game.id));
  const watchedSlugs = new Set(watchlist.map((item) => item.game.slug));

  if (!seed.tags.length) {
    return [];
  }

  return games
    .filter((game) => !watchedIds.has(game.id) && !watchedSlugs.has(game.slug))
    .map((game) => {
      const score = game.tags.reduce((sum, tag) => {
        const index = seed.tags.findIndex((seedTag) => isTagMatch(tag, seedTag));

        return index === -1 ? sum : sum + Math.max(1, seed.tags.length - index);
      }, 0);

      return { game, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.game.rankScore ?? 0) - (a.game.rankScore ?? 0))
    .slice(0, limit)
    .map((item) => item.game);
}
