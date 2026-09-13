import { ArrowDown, ArrowUpRight, ArrowRight, BellRing, SlidersHorizontal, Sparkles } from "lucide-react";
import { AiInsightSection } from "@/components/ai-insight-section";
import { ExperimentExposure } from "@/components/experiment-exposure";
import { getPopularCardExperiment } from "@/lib/experiments";
import { DealFeed } from "@/components/deal-feed";
import { TopNav } from "@/components/top-nav";
import { FeedNotice } from "@/components/feed-notice";
import { getPublicAiInsights } from "@/lib/ai-insights";
import { getDealFeed } from "@/lib/game-feeds";
import { getNavAuthState } from "@/lib/nav-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dealFeed, insightFeed, navState, experiment] = await Promise.all([
    getDealFeed({ country: "KR", limit: 24, minDiscount: 1 }),
    getPublicAiInsights(3),
    getNavAuthState(),
    getPopularCardExperiment()
  ]);
  return (
    <>
      <TopNav />
      <ExperimentExposure distinctId={experiment.distinctId} experimentKey={experiment.experimentKey} subjectType={experiment.subjectType} variant={experiment.variant} />
      <main id="main-content" className="container" tabIndex={-1}>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__copy">
            <span className="eyebrow"><span className="eyebrow__dot" /> GAME DEAL WATCH</span>
            <h1 id="home-title">지금 살만한<br /><span>게임 할인</span></h1>
            <p>하고 싶던 게임, 기분 좋은 가격에.<br />Steam과 Epic의 가격을 비교하고 나만의 구매 타이밍을 찾아보세요.</p>
            <div className="hero-actions">
              <a className="button button--primary" href="/deals">할인 둘러보기 <ArrowUpRight size={18} aria-hidden="true" /></a>
              <a className="button button--ghost" href="#discover">게임 먼저 보기 <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <span className="hero-note">로그인 없이 둘러보고, 마음에 들면 관심 목록에.</span>
          </div>
          <aside className="discovery-card" aria-label="빠른 할인 탐색">
            <div className="discovery-card__heading"><Sparkles size={20} aria-hidden="true" /><span>오늘은 어떤 게임을 찾나요?</span></div>
            <a href="/deals?minDiscount=50&sort=discount"><span><strong>반값 이하로 발견하기</strong><small>50% 이상 할인 중인 게임</small></span><ArrowUpRight size={20} aria-hidden="true" /></a>
            <a href="/deals?maxPrice=10000&sort=price"><span><strong>만원으로 즐기는 한 판</strong><small>10,000원 이하 게임 모아보기</small></span><ArrowUpRight size={20} aria-hidden="true" /></a>
            <a href="/app"><span><strong>내가 정한 가격에 만나기</strong><small>관심 게임과 목표 가격 관리</small></span><BellRing size={20} aria-hidden="true" /></a>
          </aside>
        </section>

        <section id="discover" aria-labelledby="discover-title">
          <div className="section-header">
            <div><span className="eyebrow">DISCOVER</span><h2 id="discover-title">할인 중인 게임</h2><p>가격과 리뷰를 나란히 비교해 보세요.</p></div>
            <a className="text-link" href="/deals"><SlidersHorizontal size={16} aria-hidden="true" /> 조건으로 찾기 <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <FeedNotice source={dealFeed.source} stale={dealFeed.dealCacheStatus === "stale"} warning={dealFeed.warning} />
          {dealFeed.filters ? <DealFeed
            key={JSON.stringify(dealFeed.filters)}
            initialGames={dealFeed.games}
            initialTagOptions={dealFeed.tagOptions ?? []}
            filters={dealFeed.filters}
            initialNextOffset={dealFeed.nextOffset}
            initialHasMore={dealFeed.hasMore}
            showFilters={false}
            cardVariant={experiment.variant}
            experimentKey={experiment.experimentKey}
            analyticsDistinctId={experiment.distinctId}
            isAuthenticated={navState.isAuthenticated}
          /> : null}
        </section>
        {insightFeed.data.length > 0 ? <AiInsightSection insights={insightFeed.data} warning={insightFeed.warning} /> : null}
        <footer className="site-footer"><span className="brand">Game Deal Watch</span><p>가격은 변경될 수 있어요. 최종 가격과 할인 기간은 구매할 스토어에서 확인해 주세요.</p><a className="text-link" href="#main-content">맨 위로 ↑</a></footer>
      </main>
    </>
  );
}
