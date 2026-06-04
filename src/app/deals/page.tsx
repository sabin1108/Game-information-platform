import { Flame } from "lucide-react";
import { DealFeed } from "@/components/deal-feed";
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
    tag?: string;
  }>;
};

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const minDiscount = Number(params.minDiscount ?? "1");
  const maxPrice = Number(params.maxPrice ?? "");
  const [dealFeed, navState] = await Promise.all([
    getDealFeed({
      country: "KR",
      offset: 0,
      limit: 40,
      minDiscount: Number.isFinite(minDiscount) ? minDiscount : 1,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      store: params.store,
      tag: params.tag,
      sort: params.sort
    }),
    getNavAuthState()
  ]);
  const { games: deals, source, warning, dealCacheStatus, filters, tagOptions } = dealFeed;

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

        {warning ? <div className="notice">{warning}</div> : null}

        {filters ? (
          <DealFeed
            initialGames={deals}
            initialTagOptions={tagOptions ?? []}
            filters={filters}
            isAuthenticated={navState.isAuthenticated}
          />
        ) : null}
      </main>
    </>
  );
}
