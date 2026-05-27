import { AddToWatchlistForm } from "@/components/add-to-watchlist-form";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { isSupabaseConfigured } from "@/lib/env";
import { searchGameFeed } from "@/lib/game-feeds";
import { createClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

async function getIsAuthenticated() {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return Boolean(user);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const [{ games: results, source, warning, cacheStatus }, isAuthenticated] = await Promise.all([
    searchGameFeed(q),
    getIsAuthenticated()
  ]);

  return (
    <>
      <TopNav isAuthenticated={isAuthenticated} />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>{q ? `"${q}" 검색 결과` : "게임 검색"}</h1>
            <p>
              {results.length}개 게임 · {source.toUpperCase()}
              {cacheStatus ? ` · 캐시 ${cacheStatus.toUpperCase()}` : ""}
            </p>
          </div>
        </section>

        {warning ? <div className="notice">{warning}</div> : null}

        <section className="game-grid" aria-label="검색 결과">
          {results.map((game) => (
            <GameCard key={game.id} game={game} action={<AddToWatchlistForm game={game} />} />
          ))}
        </section>
      </main>
    </>
  );
}
