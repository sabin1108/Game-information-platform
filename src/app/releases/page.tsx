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
            <p>최근 출시작과 곧 나올 게임을 한곳에서 확인합니다.</p>
          </div>
          <span className="match">
            <Sparkles size={16} aria-hidden="true" />
            {releases.length}개 후보
          </span>
        </section>

        <section className="game-grid" aria-label="신작과 출시 예정 게임">
          {releases.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
