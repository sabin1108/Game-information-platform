import type { GameSummary, ReleaseStatus } from "@/types/game";

function parseReleaseTime(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : undefined;
}

export function getDateAwareReleaseStatus(game: Pick<GameSummary, "releaseDate" | "releaseStatus">, now = Date.now()): ReleaseStatus {
  const releaseTime = parseReleaseTime(game.releaseDate);

  if (typeof releaseTime === "number") {
    return releaseTime <= now ? "released" : "upcoming";
  }

  return game.releaseStatus;
}

function normalizeGameReleaseStatus(game: GameSummary, now = Date.now()): GameSummary {
  return {
    ...game,
    releaseStatus: getDateAwareReleaseStatus(game, now)
  };
}

export function normalizeGameReleaseStatuses(games: GameSummary[], now = Date.now()) {
  return games.map((game) => normalizeGameReleaseStatus(game, now));
}
