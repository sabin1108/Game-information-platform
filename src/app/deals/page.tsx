import { Flame } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { getDealFeed } from "@/lib/game-feeds";

export default async function DealsPage() {
  const { games: deals, source, warning } = await getDealFeed({
    country: "KR",
    limit: 80,
    minDiscount: 1
  });

  return (
    <>
      <TopNav />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>할인 게임 모아보기</h1>
            <p>할인 중인 게임을 많이 펼쳐두고, 스토어별 가격과 할인율을 빠르게 비교합니다.</p>
          </div>
          <span className="match">
            <Flame size={16} aria-hidden="true" />
            {deals.length}개 · {source.toUpperCase()}
          </span>
        </section>

        {warning ? <div className="notice">{warning}</div> : null}

        <section className="game-grid" aria-label="할인 게임">
          {deals.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
