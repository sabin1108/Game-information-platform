import { Flame, Star, TrendingUp } from "lucide-react";
import { AiInsightSection } from "@/components/ai-insight-section";
import { ExperimentExposure } from "@/components/experiment-exposure";
import { GameFeed } from "@/components/game-feed";
import { TopNav } from "@/components/top-nav";
import { getPublicAiInsights } from "@/lib/ai-insights";
import { getPopularCardExperiment } from "@/lib/experiments";
import { getDealFeed, hasActiveDiscount } from "@/lib/game-feeds";
import { mockGames } from "@/lib/mock-data";
import { getNavAuthState } from "@/lib/nav-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dealFeed, insightFeed, popularCardExperiment, navState] = await Promise.all([
    getDealFeed({ country: "KR", limit: 80, minDiscount: 1 }),
    getPublicAiInsights(3),
    getPopularCardExperiment(),
    getNavAuthState()
  ]);
  const discountedGames = dealFeed.games.filter(hasActiveDiscount);
  const featuredGames = mockGames.filter(hasActiveDiscount).slice(0, 24);

  return (
    <>
      <TopNav />
      <ExperimentExposure
        distinctId={popularCardExperiment.distinctId}
        experimentKey={popularCardExperiment.experimentKey}
        subjectType={popularCardExperiment.subjectType}
        variant={popularCardExperiment.variant}
      />
      <main className="container">
        <div className="tabs" aria-label="주요 화면">
          <a className="tab" data-active="true" href="/">
            <TrendingUp size={16} aria-hidden="true" />
            인기
          </a>
          <a className="tab" href="/deals">
            <Flame size={16} aria-hidden="true" />
            할인
          </a>
        </div>

        <section className="section-header">
          <div>
            <h1>지금 살만한 게임 할인</h1>
            <p>
              Steam과 Epic 가격을 한 화면에서 비교합니다.
              리뷰 반응과 할인율을 같이 보고 관심 게임을 골라보세요.
            </p>
          </div>
        </section>

        <section className="status-strip" aria-label="서비스 상태">
          <div className="stat">
            <span>확인 중인 스토어</span>
            <strong>Steam + Epic</strong>
          </div>
          <div className="stat">
            <span>할인 중</span>
            <strong>{discountedGames.length}</strong>
          </div>
          <div className="stat">
            <span>데이터 출처</span>
            <strong>
              <Star size={18} aria-hidden="true" /> CURATED
            </strong>
          </div>
        </section>

        {dealFeed.warning ? <div className="notice">{dealFeed.warning}</div> : null}

        <AiInsightSection insights={insightFeed.data} warning={insightFeed.warning} />

        <GameFeed
          initialGames={featuredGames}
          cardVariant={popularCardExperiment.variant}
          experimentKey={popularCardExperiment.experimentKey}
          analyticsDistinctId={popularCardExperiment.distinctId}
          isAuthenticated={navState.isAuthenticated}
          enableLoadMore={false}
        />
      </main>
    </>
  );
}
