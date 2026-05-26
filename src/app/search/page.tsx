import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { searchGameFeed } from "@/lib/game-feeds";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const { games: results, source, warning } = await searchGameFeed(q);

  return (
    <>
      <TopNav />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>{q ? `"${q}" 검색 결과` : "게임 검색"}</h1>
            <p>{source.toUpperCase()} 기준 검색 결과입니다.</p>
          </div>
        </section>

        {warning ? <div className="notice">{warning}</div> : null}

        <section className="game-grid" aria-label="검색 결과">
          {results.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </main>
    </>
  );
}
