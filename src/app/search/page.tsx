import { GameCard } from "@/components/game-card";
import { SearchTracker } from "@/components/search-tracker";
import { TopNav } from "@/components/top-nav";
import { searchGameFeed } from "@/lib/game-feeds";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    store?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "", tag = "", store = "" } = await searchParams;
  const { games: results, source, warning, cacheStatus } = await searchGameFeed(q, { tag, store });

  return (
    <>
      <TopNav />
      <main className="container">
        <SearchTracker query={q} tag={tag} />
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

        <form className="deal-filters" action="/search">
          <label className="field">
            <span>검색어</span>
            <input name="q" defaultValue={q} placeholder="게임명" />
          </label>
          <label className="field">
            <span>태그/장르</span>
            <input name="tag" defaultValue={tag} placeholder="RPG, Action, Co-op" />
          </label>
          <label className="field">
            <span>스토어</span>
            <select name="store" defaultValue={store}>
              <option value="">전체</option>
              <option value="steam">Steam</option>
              <option value="epic">Epic Games</option>
            </select>
          </label>
          <button className="button button--primary" type="submit">
            필터 적용
          </button>
        </form>

        <section className="game-grid" aria-label="검색 결과">
          {results.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              action={
                <a className="button button--primary" href="/login">
                  로그인 후 찜하기
                </a>
              }
            />
          ))}
        </section>
      </main>
    </>
  );
}
