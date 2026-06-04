"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameCard } from "@/components/game-card";
import { GameCardWatchlistAction } from "@/components/game-card-watchlist-action";
import type { DealFilterState } from "@/lib/deal-cache";
import type { GameSummary } from "@/types/game";

type DealsResponse = {
  data: GameSummary[];
  nextOffset?: number;
  hasMore?: boolean;
  warning?: string;
  tagOptions?: string[];
};

type DealFeedProps = {
  initialGames: GameSummary[];
  initialTagOptions: string[];
  filters: DealFilterState;
  isAuthenticated: boolean;
};

function mergeUniqueGames(current: GameSummary[], next: GameSummary[]) {
  const byGame = new Map(current.map((game) => [game.id, game]));

  for (const game of next) {
    if (!byGame.has(game.id)) {
      byGame.set(game.id, game);
    }
  }

  return [...byGame.values()];
}

function mergeTagOptions(current: string[], next: string[]) {
  return [...new Set([...current, ...next])];
}

export function DealFeed({
  initialGames,
  initialTagOptions,
  filters,
  isAuthenticated
}: DealFeedProps) {
  const [games, setGames] = useState(initialGames);
  const [tagOptions, setTagOptions] = useState(initialTagOptions);
  const [nextOffset, setNextOffset] = useState(filters.offset + initialGames.length);
  const [hasMore, setHasMore] = useState(initialGames.length >= filters.limit);
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const requestCursor = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const selectedTag = filters.tag ?? "";

  const queryBase = useMemo(() => {
    const params = new URLSearchParams({
      country: filters.country,
      limit: String(filters.limit),
      minDiscount: String(filters.minDiscount),
      sort: filters.sort
    });

    if (filters.store) {
      params.set("store", filters.store);
    }

    if (filters.tag) {
      params.set("tag", filters.tag);
    }

    if (filters.maxPriceCents) {
      params.set("maxPrice", String(Math.floor(filters.maxPriceCents / 100)));
    }

    return params;
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    const requestId = requestCursor.current + 1;
    requestCursor.current = requestId;

    try {
      const params = new URLSearchParams(queryBase);
      params.set("offset", String(nextOffset));

      const response = await fetch(`/api/deals?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as DealsResponse;

      if (requestCursor.current !== requestId) {
        return;
      }

      setGames((current) => mergeUniqueGames(current, payload.data ?? []));
      setTagOptions((current) => mergeTagOptions(current, payload.tagOptions ?? []));
      setNextOffset(payload.nextOffset ?? nextOffset + (payload.data?.length ?? 0));
      setHasMore(Boolean(payload.hasMore && payload.data?.length));
      setWarning(payload.warning ?? null);
    } catch (error) {
      setWarning(error instanceof Error ? error.message : "할인 목록을 불러오지 못했습니다.");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, nextOffset, queryBase]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "640px" }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <form className="deal-filters" action="/deals">
        <label className="field">
          <span>스토어</span>
          <select name="store" defaultValue={filters.store ?? "all"} aria-label="스토어 필터">
            <option value="all">전체</option>
            <option value="steam">Steam</option>
            <option value="epic">Epic Games</option>
            <option value="itad">기타 스토어</option>
          </select>
        </label>
        <label className="field">
          <span>태그</span>
          <input
            aria-label="태그 필터"
            defaultValue={selectedTag}
            list="deal-tag-options"
            name="tag"
            placeholder="전체"
          />
          <datalist id="deal-tag-options">
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>최소 할인율</span>
          <input
            aria-label="최소 할인율"
            min="0"
            max="100"
            name="minDiscount"
            type="number"
            defaultValue={filters.minDiscount}
          />
        </label>
        <label className="field">
          <span>최대 가격</span>
          <input
            aria-label="최대 가격"
            min="0"
            name="maxPrice"
            placeholder="30000"
            type="number"
            defaultValue={filters.maxPriceCents ? Math.floor(filters.maxPriceCents / 100) : ""}
          />
        </label>
        <label className="field">
          <span>정렬</span>
          <select name="sort" defaultValue={filters.sort} aria-label="할인 정렬">
            <option value="reviews">인기 많은 순</option>
            <option value="discount">할인율 높은 순</option>
            <option value="price">낮은 가격 순</option>
          </select>
        </label>
        <button className="button button--primary" type="submit">
          필터 적용
        </button>
      </form>

      {warning ? <div className="notice">{warning}</div> : null}

      <section className="game-grid" aria-label="할인 게임">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            compactMeta
            action={
              <GameCardWatchlistAction
                game={game}
                isAuthenticated={isAuthenticated}
                loginPath="/login?next=/deals"
              />
            }
          />
        ))}
      </section>

      <div className="feed-sentinel" ref={sentinelRef}>
        {isLoading ? (
          <span className="match">
            <LoaderCircle size={15} aria-hidden="true" />
            불러오는 중
          </span>
        ) : hasMore ? (
          <span className="tag">스크롤하면 더 불러옵니다.</span>
        ) : (
          <span className="tag">불러올 할인 게임이 없습니다.</span>
        )}
      </div>
    </>
  );
}
