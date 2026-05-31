import { Sparkles } from "lucide-react";
import { AddToWatchlistForm } from "@/components/add-to-watchlist-form";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { getReleaseFeed } from "@/lib/game-feeds";

export const dynamic = "force-dynamic";

type ReleasesPageProps = {
  searchParams: Promise<{
    store?: string;
    tag?: string;
  }>;
};

export default async function ReleasesPage({ searchParams }: ReleasesPageProps) {
  const params = await searchParams;
  const { games: releases, source, warning, releaseCacheStatus, releaseFilters } = await getReleaseFeed({
    country: "KR",
    limit: 80,
    store: params.store,
    tag: params.tag
  });
  const currentStore = releaseFilters?.store ?? "all";

  return (
    <>
      <TopNav />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>신작과 출시 예정</h1>
            <p>출시된 신작, 출시 예정작, 일정이 불확실한 게임을 스토어와 태그 기준으로 좁혀 봅니다.</p>
          </div>
          <span className="match">
            <Sparkles size={16} aria-hidden="true" />
            {releases.length}개 · {source.toUpperCase()}
            {releaseCacheStatus ? ` · 캐시 ${releaseCacheStatus.toUpperCase()}` : ""}
          </span>
        </section>

        <form className="deal-filters" action="/releases">
          <label className="field">
            <span>스토어</span>
            <select name="store" defaultValue={currentStore} aria-label="스토어 필터">
              <option value="all">전체</option>
              <option value="steam">Steam</option>
              <option value="epic">Epic Games</option>
              <option value="itad">기타 스토어</option>
            </select>
          </label>
          <label className="field">
            <span>태그</span>
            <input
              aria-label="태그 필터"
              name="tag"
              placeholder="RPG, Action, Co-op"
              defaultValue={releaseFilters?.tag ?? ""}
            />
          </label>
          <button className="button button--primary" type="submit">
            필터 적용
          </button>
        </form>

        {warning ? <div className="notice">{warning}</div> : null}

        <section className="game-grid" aria-label="신작과 출시 예정 게임">
          {releases.map((game) => (
            <GameCard key={game.id} game={game} action={<AddToWatchlistForm game={game} />} />
          ))}
        </section>
      </main>
    </>
  );
}
