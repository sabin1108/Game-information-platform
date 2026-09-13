"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameCard } from "@/components/game-card";
import { GameCardWatchlistAction } from "@/components/game-card-watchlist-action";
import { useIntersectionLoader } from "@/components/use-intersection-loader";
import type { DealFilterState } from "@/lib/deal-cache";
import type { PopularCardVariant } from "@/lib/analytics/events";
import type { GameSummary } from "@/types/game";

type DealsResponse = {
  source?: "itad" | "mock";
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
  showFilters?: boolean;
  cardVariant?: PopularCardVariant;
  experimentKey?: string;
  analyticsDistinctId?: string;
  initialNextOffset?: number;
  initialHasMore?: boolean;
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
  isAuthenticated,
  showFilters = true,
  cardVariant,
  experimentKey,
  analyticsDistinctId,
  initialNextOffset,
  initialHasMore
}: DealFeedProps) {
  const [games, setGames] = useState(initialGames);
  const [tagOptions, setTagOptions] = useState(initialTagOptions);
  const [nextOffset, setNextOffset] = useState(initialNextOffset ?? filters.offset + initialGames.length);
  const [hasMore, setHasMore] = useState(initialHasMore ?? initialGames.length >= filters.limit);
  const [isLoading, setIsLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
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
    if (inFlight.current || !hasMore) {
      return;
    }

    inFlight.current = true;
    setIsLoading(true);
    setFailed(false);
    setWarning(null);
    controller.current = new AbortController();

    try {
      const params = new URLSearchParams(queryBase);
      params.set("offset", String(nextOffset));

      const response = await fetch(`/api/deals?${params.toString()}`, { cache: "no-store", signal: controller.current.signal });
      if (!response.ok) throw new Error("request failed");
      const payload = (await response.json()) as DealsResponse;
      if (!Array.isArray(payload.data)) throw new Error("invalid response");

      setGames((current) => mergeUniqueGames(current, payload.data ?? []));
      setTagOptions((current) => mergeTagOptions(current, payload.tagOptions ?? []));
      setNextOffset(payload.nextOffset ?? nextOffset + (payload.data?.length ?? 0));
      setHasMore(Boolean(payload.hasMore && (payload.nextOffset ?? nextOffset + payload.data.length) > nextOffset));
      setWarning(payload.source === "mock" ? "추가 목록에는 예시 게임이 포함되어 있어요. 실제 판매가는 스토어에서 확인해 주세요." : payload.warning ? "일부 가격을 갱신하지 못했습니다. 구매 전 스토어 가격을 확인해 주세요." : null);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setWarning("할인 목록을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
      setFailed(true);
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, [hasMore, nextOffset, queryBase]);

  useIntersectionLoader(sentinelRef, () => {
    if (!failed) void loadMore();
  });

  return (
    <>
      {showFilters ? <form className="deal-filters" action="/deals" aria-label="할인 필터">
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
          <span>최소 할인율 (%)</span>
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
          <span>최대 가격 (원)</span>
          <input
            aria-label="최대 가격"
            min="0"
            name="maxPrice"
            placeholder="제한 없음"
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
        <div className="form-actions filter-actions">
          <button className="button button--primary" type="submit">필터 적용</button>
          <a className="button button--ghost" href="/deals">초기화</a>
        </div>
      </form> : null}

      {warning ? <div className="notice" role="alert">{warning}</div> : null}

      <p className="result-count" role="status">{games.length}개 게임을 확인하고 있어요</p>
      {!games.length && !hasMore ? <div className="empty-state empty-state--full"><h2>조건에 맞는 할인 게임이 없어요</h2><p>할인율이나 가격 조건을 넓혀 다시 찾아보세요.</p><a className="button" href="/deals">필터 초기화</a></div> : null}
      <section className={cardVariant === "variant_a" ? "game-grid game-grid--dense" : "game-grid"} data-experiment-key={experimentKey} data-experiment-variant={cardVariant} aria-label="할인 게임" aria-busy={isLoading}>
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            compactMeta
            cardVariant={cardVariant}
            experimentKey={experimentKey}
            analyticsDistinctId={analyticsDistinctId}
            action={
              <GameCardWatchlistAction
                game={game}
                isAuthenticated={isAuthenticated}
                loginPath={`/login?next=${encodeURIComponent(`/deals?${queryBase.toString()}`)}`}
              />
            }
          />
        ))}
      </section>

      <div className="feed-sentinel" ref={sentinelRef}>
        {isLoading ? (
          <span className="match" role="status">
            <LoaderCircle size={15} aria-hidden="true" />
            불러오는 중
          </span>
        ) : hasMore ? (
          <button className="button" onClick={loadMore} type="button">{failed ? "다시 시도" : "더 보기"}</button>
        ) : (
          <span className="tag">할인 게임을 모두 확인했어요.</span>
        )}
      </div>
    </>
  );
}
