import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { searchMockGames } from "@/lib/mock-data";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const results = searchMockGames(q);

  return (
    <>
      <TopNav />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>{q ? `"${q}" 검색 결과` : "게임 검색"}</h1>
            <p>현재는 데모 데이터 기반이며, API 연결 후 IsThereAnyDeal 검색 결과로 대체됩니다.</p>
          </div>
        </section>

        <section className="game-grid" aria-label="검색 결과">
          {results.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
