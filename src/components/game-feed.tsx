"use client";

import { LoaderCircle } from "lucide-react";
import { GameCardWatchlistAction } from "@/components/game-card-watchlist-action";
import { useCallback, useRef, useState } from "react";
import { GameCard } from "@/components/game-card";
import { useIntersectionLoader } from "@/components/use-intersection-loader";
import type { PopularCardVariant } from "@/lib/analytics/events";
import type { GameSummary } from "@/types/game";

type PopularResponse = {
  data: GameSummary[];
  nextOffset: number;
  hasMore: boolean;
  warning?: string;
};

type GameFeedProps = {
  initialGames: GameSummary[];
  tag?: string;
  store?: string;
  cardVariant?: PopularCardVariant;
  experimentKey?: string;
  analyticsDistinctId?: string;
  isAuthenticated?: boolean;
};

export function GameFeed({
  initialGames,
  tag = "",
  store = "",
  cardVariant,
  experimentKey,
  analyticsDistinctId,
  isAuthenticated = false
}: GameFeedProps) {
  const [games, setGames] = useState(initialGames);
  const [offset, setOffset] = useState(initialGames.length);
  const [hasMore, setHasMore] = useState(initialGames.length > 0);
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: "24"
      });

      if (tag) {
        params.set("tag", tag);
      }

      if (store) {
        params.set("store", store);
      }

      const response = await fetch(`/api/public/popular?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as PopularResponse;

      setGames((current) => {
        const seen = new Set(current.map((game) => game.id));
        const next = payload.data.filter((game) => !seen.has(game.id));

        return [...current, ...next];
      });
      setOffset(payload.nextOffset);
      setHasMore(payload.hasMore && payload.data.length > 0);
      setWarning(payload.warning ?? null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "게임 목록을 불러오지 못했습니다.");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, offset, store, tag]);

  useIntersectionLoader(sentinelRef, () => {
    void loadMore();
  });

  return (
    <>
      <section
        className={cardVariant === "variant_a" ? "game-grid game-grid--dense" : "game-grid"}
        aria-label="인기 게임"
        data-experiment-key={experimentKey}
        data-experiment-variant={cardVariant}
      >
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            cardVariant={cardVariant}
            experimentKey={experimentKey}
            analyticsDistinctId={analyticsDistinctId}
            action={
              <GameCardWatchlistAction
                game={game}
                isAuthenticated={isAuthenticated}
                loginPath="/login?next=/"
              />
            }
          />
        ))}
      </section>
      {warning ? <div className="notice" role="alert">{warning}</div> : null}
      <div className="feed-sentinel" ref={sentinelRef}>
        {isLoading ? (
          <span className="match">
            <LoaderCircle size={15} aria-hidden="true" />
            불러오는 중
          </span>
        ) : hasMore ? (
          <button className="button" onClick={loadMore} type="button">
            더 보기
          </button>
        ) : (
          <span className="tag">불러올 게임이 없습니다.</span>
        )}
      </div>
    </>
  );
}
