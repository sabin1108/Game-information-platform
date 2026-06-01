import { Flame } from "lucide-react";
import { GameCardWatchlistAction } from "@/components/game-card-watchlist-action";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { getDealFeed } from "@/lib/game-feeds";
import { getNavAuthState } from "@/lib/nav-auth";

export const dynamic = "force-dynamic";

type DealsPageProps = {
  searchParams: Promise<{
    store?: string;
    minDiscount?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const minDiscount = Number(params.minDiscount ?? "1");
  const maxPrice = Number(params.maxPrice ?? "");
  const [dealFeed, navState] = await Promise.all([
    getDealFeed({
      country: "KR",
      limit: 80,
      minDiscount: Number.isFinite(minDiscount) ? minDiscount : 1,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      store: params.store,
      sort: params.sort
    }),
    getNavAuthState()
  ]);
  const { games: deals, source, warning, dealCacheStatus, filters } = dealFeed;

  const currentStore = filters?.store ?? "all";
  const currentSort = filters?.sort ?? "discount";

  return (
    <>
      <TopNav />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>할인 게임 모아보기</h1>
            <p>서버에서 할인 정보를 가져오고 캐시한 뒤 스토어, 할인율, 가격 조건으로 좁혀봅니다.</p>
          </div>
          <span className="match">
            <Flame size={16} aria-hidden="true" />
            {deals.length}개 · {source.toUpperCase()}
            {dealCacheStatus ? ` · 캐시 ${dealCacheStatus.toUpperCase()}` : ""}
          </span>
        </section>

        <form className="deal-filters" action="/deals">
          <label className="field">
            <span>스토어</span>
            <select name="store" defaultValue={currentStore} aria-label="스토어 필터">
              <option value="all">전체</option>
              <option value="steam">Steam</option>
              <option value="epic">Epic Games</option>
              <option value="itad">기타 스토어</option>
            </select>
          </label>
          <label className="field">
            <span>최소 할인율</span>
            <input
              aria-label="최소 할인율"
              min="0"
              max="100"
              name="minDiscount"
              type="number"
              defaultValue={filters?.minDiscount ?? 1}
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
              defaultValue={filters?.maxPriceCents ? Math.floor(filters.maxPriceCents / 100) : ""}
            />
          </label>
          <label className="field">
            <span>정렬</span>
            <select name="sort" defaultValue={currentSort} aria-label="할인 정렬">
              <option value="discount">할인율 높은 순</option>
              <option value="price">낮은 가격 순</option>
              <option value="reviews">리뷰 반응 순</option>
            </select>
          </label>
          <button className="button button--primary" type="submit">
            필터 적용
          </button>
        </form>

        {warning ? <div className="notice">{warning}</div> : null}

        <section className="game-grid" aria-label="할인 게임">
          {deals.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              action={
                <GameCardWatchlistAction
                  game={game}
                  isAuthenticated={navState.isAuthenticated}
                  loginPath="/login?next=/deals"
                />
              }
            />
          ))}
        </section>
      </main>
    </>
  );
}
