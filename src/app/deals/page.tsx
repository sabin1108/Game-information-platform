import { Flame } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { mockGames } from "@/lib/mock-data";

export default function DealsPage() {
  const deals = mockGames.filter((game) => game.prices.some((price) => price.discountPercent > 0));

  return (
    <>
      <TopNav />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>Steam/Epic 할인 탐색</h1>
            <p>할인율, 리뷰 수, 스토어 가격 비교를 기준으로 구매 후보를 빠르게 훑습니다.</p>
          </div>
          <span className="match">
            <Flame size={16} aria-hidden="true" />
            {deals.length} deals
          </span>
        </section>

        <section className="game-grid" aria-label="할인 게임">
          {deals.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
