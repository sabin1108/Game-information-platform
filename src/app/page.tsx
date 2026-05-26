import Link from "next/link";
import { Flame, Sparkles, Star, TrendingUp } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { mockGames } from "@/lib/mock-data";

export default function HomePage() {
  const discountedGames = mockGames.filter((game) =>
    game.prices.some((price) => price.discountPercent > 0)
  );
  const upcomingGames = mockGames.filter((game) => game.releaseStatus === "upcoming");

  return (
    <>
      <TopNav />
      <main className="container">
        <div className="tabs" aria-label="주요 보기">
          <Link className="tab" data-active="true" href="/">
            <TrendingUp size={16} aria-hidden="true" />
            인기
          </Link>
          <Link className="tab" href="/deals">
            <Flame size={16} aria-hidden="true" />
            할인
          </Link>
          <Link className="tab" href="/releases">
            <Sparkles size={16} aria-hidden="true" />
            신작
          </Link>
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
            <span>정렬 기준</span>
            <strong>
              <Star size={18} aria-hidden="true" /> 리뷰
            </strong>
          </div>
        </section>

        <section className="game-grid" aria-label="인기 게임">
          {mockGames.slice(0, 6).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
