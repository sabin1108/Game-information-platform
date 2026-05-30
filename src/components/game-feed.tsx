"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameCard } from "@/components/game-card";
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
};

export function GameFeed({ initialGames, tag = "", store = "" }: GameFeedProps) {
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
      setWarning(error instanceof Error ? error.message : "게임 목록을 더 불러오지 못했습니다.");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, offset, store, tag]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        void loadMore();
      }
    }, { rootMargin: "640px" });

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <section className="game-grid" aria-label="인기 게임">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>
      {warning ? <div className="notice" role="alert">{warning}</div> : null}
      <div className="feed-sentinel" ref={sentinelRef}>
        {isLoading ? (
          <span className="match">
            <LoaderCircle size={15} aria-hidden="true" />
            더 불러오는 중
          </span>
        ) : hasMore ? (
          <button className="button" onClick={loadMore} type="button">
            더 보기
          </button>
        ) : (
          <span className="tag">불러올 게임이 더 없습니다.</span>
        )}
      </div>
    </>
  );
}
