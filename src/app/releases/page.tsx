import { Sparkles } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { mockGames } from "@/lib/mock-data";

export default function ReleasesPage() {
  const releases = mockGames.filter(
    (game) => game.releaseStatus === "upcoming" || game.releaseDate?.startsWith("2024")
  );

  return (
    <>
      <TopNav />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>신작과 출시 예정</h1>
            <p>스토어와 태그 필터를 붙이기 전 단계의 신작 탐색 화면입니다.</p>
          </div>
          <span className="match">
            <Sparkles size={16} aria-hidden="true" />
            {releases.length} candidates
          </span>
        </section>

        <section className="game-grid" aria-label="신작 및 출시 예정">
          {releases.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
