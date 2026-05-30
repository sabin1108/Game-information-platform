import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { BellRing, Database, ShieldCheck, TrendingDown } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { WatchlistTargetForm } from "@/components/watchlist-target-form";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { getDealFeed } from "@/lib/game-feeds";
import { getTargetMatchState, isTargetMatched, sortWatchlistByTargetStatus } from "@/lib/game-score";
import { mockWatchlist } from "@/lib/mock-data";
import { recommendGames } from "@/lib/recommendations";
import { getOrCreateProfile, type Profile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { getUserWatchlist } from "@/lib/watchlist";

export const dynamic = "force-dynamic";

type AppDashboardPageProps = {
  searchParams: Promise<{
    message?: string;
    error?: string;
    filter?: string;
  }>;
};

const demoProfile: Profile = {
  id: "demo",
  display_name: "demo",
  avatar_url: null,
  preferred_country: "KR",
  preferred_currency: "KRW",
  webview_last_seen_at: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString()
};

async function getSearchTerms() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("gdw_search_terms")?.value;

  if (!raw) {
    return [];
  }

  try {
    const terms = JSON.parse(raw);

    return Array.isArray(terms)
      ? terms.filter((term): term is string => typeof term === "string" && Boolean(term.trim())).slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

async function getSessionState() {
  if (!isSupabaseConfigured()) {
    return { isAuthenticated: true, demoMode: true, profile: demoProfile, userId: "demo" };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return {
    isAuthenticated: true,
    demoMode: false,
    userId: user.id,
    profile: await getOrCreateProfile(supabase, user)
  };
}

export default async function AppDashboardPage({ searchParams }: AppDashboardPageProps) {
  const { message, error, filter } = await searchParams;
  const [session, searchTerms] = await Promise.all([getSessionState(), getSearchTerms()]);
  const watchlistItems = session.demoMode
    ? mockWatchlist
    : await getUserWatchlist(session.userId);
  const dealFeed = await getDealFeed({ country: session.profile.preferred_country, limit: 80, minDiscount: 1 });
  const sortedItems = sortWatchlistByTargetStatus(watchlistItems);
  const matchedItems = sortedItems.filter(isTargetMatched);
  const visibleItems = filter === "matched" ? matchedItems : sortedItems;
  const recommendations = recommendGames(dealFeed.games, watchlistItems, searchTerms, 6);

  return (
    <>
      <TopNav isAuthenticated={session.isAuthenticated} />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>관심 게임</h1>
            <p>
              게임마다 원하는 가격이나 할인율을 저장해두세요.
              조건을 만족한 게임은 위쪽에 먼저 보여줍니다.
            </p>
          </div>
          {session.demoMode ? <span className="notice">데모 모드라 목표 수정은 비활성화되어 있습니다.</span> : null}
        </section>

        {message ? <div className="notice notice--success" role="status">{message}</div> : null}
        {error ? <div className="notice" role="alert">{error}</div> : null}

        <section className="status-strip" aria-label="대시보드 상태">
          <div className="stat">
            <span>관심 게임</span>
            <strong>{watchlistItems.length}</strong>
          </div>
          <div className="stat">
            <span>조건 충족</span>
            <strong>{matchedItems.length}</strong>
          </div>
          <div className="stat">
            <span>가격 데이터</span>
            <strong>
              <Database size={18} aria-hidden="true" /> DB
            </strong>
          </div>
          <div className="stat">
            <span>적용 범위</span>
            <strong>
              <ShieldCheck size={18} aria-hidden="true" /> 내 목록
            </strong>
          </div>
        </section>

        <div className="filter-bar" aria-label="관심 목록 필터">
          <a className="tab" data-active={filter !== "matched"} href="/app">
            전체
          </a>
          <a className="tab" data-active={filter === "matched"} href="/app?filter=matched">
            조건 충족만
          </a>
        </div>

        <div className="dashboard-grid">
          <section className="panel" id="targets">
            <h2>목표 조건</h2>
            <div className="watchlist">
              {visibleItems.length ? (
                visibleItems.map((item) => <WatchlistTargetForm disabled={session.demoMode} item={item} key={item.id} />)
              ) : (
                <div className="watchlist-row">
                  <div>
                    <h3>조건에 맞는 게임이 없습니다.</h3>
                    <div className="tag-row">
                      <span className="tag">검색에서 게임을 추가하거나 필터를 해제하세요.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="panel">
            <h2>프로필</h2>
            <p>
              {session.profile.display_name ?? "이름 없음"} 계정은{" "}
              {session.profile.preferred_country}/{session.profile.preferred_currency} 기준으로 가격을 확인합니다.
            </p>
            <span className="match">
              <TrendingDown size={15} aria-hidden="true" />
              구매 후보 확인 가능
            </span>
            <a className="button" href="/app/profile">
              프로필 수정
            </a>
          </aside>
        </div>

        <section className="section-header">
          <div>
            <h2>스토어별 가격</h2>
            <p>Steam/Epic 가격을 게임 단위로 묶고, 최신 가격으로 목표 조건을 계산합니다.</p>
          </div>
        </section>

        <section className="game-grid" aria-label="관심 게임 가격">
          {visibleItems.map((item) => {
            const matchState = getTargetMatchState(item);
            const label = matchState.bestPrice
              ? `최저 ${formatPrice(matchState.bestPrice.currentPriceCents, matchState.bestPrice.currency)}`
              : "현재 가격 없음";

            return (
              <GameCard
                action={
                  <a className="button button--primary" href="#targets">
                    <BellRing size={17} aria-hidden="true" />
                    목표 수정
                  </a>
                }
                actionLabel={label}
                game={item.game}
                key={item.id}
              />
            );
          })}
        </section>

        {recommendations.length ? (
          <>
            <section className="section-header">
              <div>
                <h2>태그 기반 추천</h2>
                <p>찜한 게임과 최근 검색 태그를 할인 목록과 비교해 다음 후보를 고릅니다.</p>
              </div>
            </section>
            <section className="game-grid" aria-label="추천 게임">
              {recommendations.map((game) => (
                <GameCard game={game} key={game.id} />
              ))}
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}
