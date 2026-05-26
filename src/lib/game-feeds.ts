import "server-only";

import { isItadConfigured } from "@/lib/env";
import { getItadDeals, getItadPopular, searchItadGames } from "@/lib/itad";
import { mockGames, searchMockGames } from "@/lib/mock-data";
import type { GameSummary } from "@/types/game";

export type GameFeed = {
  source: "itad" | "mock";
  games: GameSummary[];
  warning?: string;
};

function getWarning(error: unknown) {
  return error instanceof Error ? error.message : "ITAD request failed.";
}

export async function getPopularFeed(limit = 12): Promise<GameFeed> {
  if (!isItadConfigured()) {
    return { source: "mock", games: mockGames.slice(0, limit) };
  }

  try {
    return { source: "itad", games: await getItadPopular(limit) };
  } catch (error) {
    return {
      source: "mock",
      warning: getWarning(error),
      games: mockGames.slice(0, limit)
    };
  }
}

export async function getDealFeed(options: {
  country?: string;
  limit?: number;
  minDiscount?: number;
} = {}): Promise<GameFeed> {
  if (!isItadConfigured()) {
    return {
      source: "mock",
      games: mockGames.filter((game) => game.prices.some((price) => price.discountPercent > 0))
    };
  }

  try {
    return { source: "itad", games: await getItadDeals(options) };
  } catch (error) {
    return {
      source: "mock",
      warning: getWarning(error),
      games: mockGames.filter((game) => game.prices.some((price) => price.discountPercent > 0))
    };
  }
}

export async function searchGameFeed(query: string): Promise<GameFeed> {
  const trimmed = query.trim();

  if (!trimmed || !isItadConfigured()) {
    return { source: "mock", games: searchMockGames(query) };
  }

  try {
    return { source: "itad", games: await searchItadGames(trimmed) };
  } catch (error) {
    return {
      source: "mock",
      warning: getWarning(error),
      games: searchMockGames(query)
    };
  }
}
