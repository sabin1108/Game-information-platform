import { Flame, Sparkles, Star, TrendingUp } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { getDealFeed, getPopularFeed } from "@/lib/game-feeds";

export default async function HomePage() {
  const [popularFeed, dealFeed] = await Promise.all([
    getPopularFeed(12),
    getDealFeed({ country: "KR", limit: 20, minDiscount: 1 })
  ]);
  const discountedGames = dealFeed.games.filter((game) =>
    game.prices.some((price) => price.discountPercent > 0)
  );
  const upcomingGames = popularFeed.games.filter((game) => game.releaseStatus === "upcoming");

  return (
    <>
      <TopNav />
      <main className="container">
        <div className="tabs" aria-label="주요 보기">
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
            <h1>리뷰가 검증한 할인 게임</h1>
            <p>
              비로그인 홈은 Steam 리뷰 수와 긍정 평가율을 중심으로 인기 게임을 보여주고,
              Steam/Epic 현재 가격을 함께 비교합니다.
            </p>
          </div>
        </section>

        <section className="status-strip" aria-label="서비스 지표">
          <div className="stat">
            <span>추적 스토어</span>
            <strong>Steam + Epic</strong>
          </div>
          <div className="stat">
            <span>할인 중</span>
            <strong>{discountedGames.length}개</strong>
          </div>
          <div className="stat">
            <span>출시 예정</span>
            <strong>{upcomingGames.length}개</strong>
          </div>
          <div className="stat">
            <span>데이터 소스</span>
            <strong>
              <Star size={18} aria-hidden="true" /> {popularFeed.source.toUpperCase()}
            </strong>
          </div>
        </section>

        {popularFeed.warning ? <div className="notice">{popularFeed.warning}</div> : null}

        <section className="game-grid" aria-label="인기 게임">
          {popularFeed.games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
