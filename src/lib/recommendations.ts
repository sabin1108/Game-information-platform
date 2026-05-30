import type { GameSummary, WatchlistItem } from "@/types/game";

export type RecommendationSeed = {
  tags: string[];
  searches?: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function addWeight(weights: Map<string, number>, key: string, value: number) {
  const normalized = normalize(key);

  if (normalized) {
    weights.set(normalized, (weights.get(normalized) ?? 0) + value);
  }
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
    return games
      .filter((game) => !watchedIds.has(game.id) && !watchedSlugs.has(game.slug))
      .slice(0, limit);
  }

  return games
    .filter((game) => !watchedIds.has(game.id) && !watchedSlugs.has(game.slug))
    .map((game) => {
      const score = game.tags.reduce((sum, tag) => {
        const tagName = normalize(tag);
        const index = seed.tags.findIndex((seedTag) => tagName.includes(seedTag) || seedTag.includes(tagName));

        return index === -1 ? sum : sum + Math.max(1, seed.tags.length - index);
      }, 0);

      return { game, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (b.game.rankScore ?? 0) - (a.game.rankScore ?? 0))
    .slice(0, limit)
    .map((item) => item.game);
}
