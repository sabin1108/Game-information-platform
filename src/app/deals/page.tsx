import { FeedNotice } from "@/components/feed-notice";
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
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : NaN;
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
      <main id="main-content" className="container" tabIndex={-1}>
        <section className="section-header">
          <div>
            <h1>할인 게임 모아보기</h1>
            <p>원하는 스토어와 예산을 정하고, 마음에 드는 할인을 찾아보세요.</p>
          </div>
          <span className="match">
            <Flame size={16} aria-hidden="true" />
            Steam · Epic · 그 외 스토어

          </span>
        </section>

        <FeedNotice source={source} stale={dealCacheStatus === "stale"} warning={warning} />

        {filters ? (
          <DealFeed
            key={JSON.stringify(filters)}
            initialNextOffset={dealFeed.nextOffset}
            initialHasMore={dealFeed.hasMore}
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
