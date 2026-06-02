import { Flame, Sparkles, Star, TrendingUp } from "lucide-react";
import { ExperimentExposure } from "@/components/experiment-exposure";
import { GameFeed } from "@/components/game-feed";
import { TopNav } from "@/components/top-nav";
import { getPopularCardExperiment } from "@/lib/experiments";
import { getDealFeed, getPopularFeed } from "@/lib/game-feeds";
import { getNavAuthState } from "@/lib/nav-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [popularFeed, dealFeed, popularCardExperiment, navState] = await Promise.all([
    getPopularFeed(24),
    getDealFeed({ country: "KR", limit: 80, minDiscount: 1 }),
    getPopularCardExperiment(),
    getNavAuthState()
  ]);
  const discountedGames = dealFeed.games.filter((game) =>
    game.prices.some((price) => price.discountPercent > 0)
  );
  const upcomingGames = popularFeed.games.filter((game) => game.releaseStatus === "upcoming");

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
          <a className="tab" href="/releases">
            <Sparkles size={16} aria-hidden="true" />
            신작
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
            <span>출시 예정</span>
            <strong>{upcomingGames.length}</strong>
          </div>
          <div className="stat">
            <span>데이터 출처</span>
            <strong>
              <Star size={18} aria-hidden="true" /> {popularFeed.source.toUpperCase()}
            </strong>
          </div>
        </section>

        {popularFeed.warning ? <div className="notice">{popularFeed.warning}</div> : null}

        <GameFeed
          initialGames={popularFeed.games}
          cardVariant={popularCardExperiment.variant}
          experimentKey={popularCardExperiment.experimentKey}
          analyticsDistinctId={popularCardExperiment.distinctId}
          isAuthenticated={navState.isAuthenticated}
        />
      </main>
    </>
  );
}
