import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { FeedNotice } from "@/components/feed-notice";
import { GameCardWatchlistAction } from "@/components/game-card-watchlist-action";
import { GameCard } from "@/components/game-card";
import { SearchControls } from "@/components/search-controls";
import { SearchTracker } from "@/components/search-tracker";
import { TopNav } from "@/components/top-nav";
import { getAuthPageHref } from "@/lib/auth-navigation";
import { getNavAuthState } from "@/lib/nav-auth";
import { searchGames } from "@/lib/search";
import { getDiscoveryTagOptions, getSearchHref, getTagLabel, normalizeSearchCriteria, normalizeSearchTag, type SearchCriteria } from "@/lib/search-filters";
import { normalizeGameReleaseStatuses } from "@/lib/release-status";
import { getSteamPopularTags } from "@/lib/steam-popular-tags";

export const dynamic = "force-dynamic";
type SearchPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function SearchResultsLoading() {
  return (
    <section aria-label="검색 결과 불러오는 중" aria-busy="true">
      <p role="status">조건에 맞는 게임을 찾고 있어요…</p>
      <div className="game-grid" aria-hidden="true">
        {[0, 1, 2].map(index => <div className="game-card" key={index}><div className="skeleton skeleton--cover" /><div className="game-card__body"><div className="skeleton skeleton--line" /><div className="skeleton skeleton--line" /></div></div>)}
      </div>
    </section>
  );
}

async function SearchResults({ criteria }: { criteria: SearchCriteria }) {
  const [feed, navState] = await Promise.all([searchGames(criteria.q, criteria), getNavAuthState()]);
  const games = normalizeGameReleaseStatuses(feed.games);
  const titleOnlyHref = getSearchHref(normalizeSearchCriteria({ q: criteria.q }));
  const hasFilters = Boolean(criteria.tag || criteria.store || criteria.maxPrice !== undefined || criteria.discounted);
  return (
    <div data-search-results="true">
      <FeedNotice source={feed.source} stale={feed.cache.status === "stale"} warning={feed.warning} />
      <div className="search-results-summary" role="status">
        <p><strong>{games.length}개 게임</strong>{feed.matchedCount > games.length ? ` · 조건에 맞는 ${feed.matchedCount}개 중 표시` : ""}</p>
        <p>{criteria.q ? "제목이 일치하는 게임을 먼저 보여드려요." : "현재 할인 중인 게임을 둘러보고 있어요."} 최대 {feed.candidateLimit}개를 불러온 뒤 조건을 적용합니다.</p>
      </div>
      {criteria.q && criteria.tag && feed.metadataMissingCount > 0 ? <p className="notice" role="status">태그를 확인하지 못한 {feed.metadataMissingCount}개 게임은 태그 조건에서 제외했어요. <a href={getSearchHref({ ...criteria, tag: "" })}>태그 없이 보기</a></p> : null}
      {!games.length ? (
        <div className="empty-state empty-state--full">
          <SearchX size={32} aria-hidden="true" />
          <h2>검색 결과가 없어요</h2>
          <p>{hasFilters ? "조건을 조금 줄여보세요. 태그나 가격 정보가 없는 게임은 조건에 따라 제외될 수 있어요." : "게임 제목을 짧게 입력하거나 영문 제목으로 다시 찾아보세요."}</p>
          {hasFilters ? <a className="button button--primary" href={titleOnlyHref}>검색 조건 줄이기</a> : <a className="button button--primary" href="/search">할인 게임 찾아보기</a>}
        </div>
      ) : null}
      <section className="game-grid" aria-label="검색 결과">
        {games.map(game => <GameCard key={game.id} game={game} action={<GameCardWatchlistAction game={game} isAuthenticated={navState.isAuthenticated} loginPath={getAuthPageHref("/login", getSearchHref(criteria))} />} />)}
      </section>
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const criteria = normalizeSearchCriteria(await searchParams);
  const searchKey = getSearchHref(criteria);
  const tags = new Map(getDiscoveryTagOptions().map(option => [option.value, option]));
  for (const tag of getSteamPopularTags()) {
    const value = normalizeSearchTag(tag);
    if (value && !tags.has(value)) tags.set(value, { value, label: getTagLabel(value) });
  }
  return (
    <>
      <TopNav variant="search" />
      <main id="main-content" className="container" tabIndex={-1}>
        <SearchTracker query={criteria.q} tag={criteria.tag} />
        <section className="section-header"><div><h1>{criteria.q ? `"${criteria.q}" 검색 결과` : "게임 검색"}</h1><p>제목으로 찾거나 태그와 예산에 맞는 할인 게임을 둘러보세요.</p></div></section>
        <SearchControls key={searchKey} criteria={criteria} tagOptions={[...tags.values()]} />
        <Suspense key={searchKey} fallback={<SearchResultsLoading />}><SearchResults criteria={criteria} /></Suspense>
      </main>
    </>
  );
}