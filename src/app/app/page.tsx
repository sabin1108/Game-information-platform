import { redirect } from "next/navigation";
import { BellRing, Database, ShieldCheck, TrendingDown } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { TopNav } from "@/components/top-nav";
import { isSupabaseConfigured } from "@/lib/env";
import { isTargetMatched } from "@/lib/game-score";
import { mockWatchlist } from "@/lib/mock-data";
import { getOrCreateProfile, type Profile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

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

async function getSessionState() {
  if (!isSupabaseConfigured()) {
    return { isAuthenticated: true, demoMode: true, profile: demoProfile };
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
    profile: await getOrCreateProfile(supabase, user)
  };
}

export default async function AppDashboardPage() {
  const session = await getSessionState();
  const matchedItems = mockWatchlist.filter(isTargetMatched);

  return (
    <>
      <TopNav isAuthenticated={session.isAuthenticated} />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>내 관심 게임</h1>
            <p>
              관심 목록의 목표 가격과 할인율을 기준으로 지금 구매 타이밍인지 확인합니다.
            </p>
          </div>
          {session.demoMode ? <span className="notice">Supabase 미설정 데모 모드</span> : null}
        </section>

        <section className="status-strip" aria-label="대시보드 지표">
          <div className="stat">
            <span>관심 게임</span>
            <strong>{mockWatchlist.length}개</strong>
          </div>
          <div className="stat">
            <span>조건 충족</span>
            <strong>{matchedItems.length}개</strong>
          </div>
          <div className="stat">
            <span>캐시 전략</span>
            <strong>
              <Database size={18} aria-hidden="true" /> DB
            </strong>
          </div>
          <div className="stat">
            <span>보안</span>
            <strong>
              <ShieldCheck size={18} aria-hidden="true" /> RLS
            </strong>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel">
            <h2>목표 조건</h2>
            <div className="watchlist">
              {mockWatchlist.map((item) => (
                <div className="watchlist-row" key={item.id}>
                  <div>
                    <h3>{item.game.title}</h3>
                    <div className="tag-row">
                      {item.targetDiscountPercent ? (
                        <span className="tag">목표 할인 {item.targetDiscountPercent}%</span>
                      ) : null}
                      {item.targetPriceCents ? <span className="tag">목표 가격 설정됨</span> : null}
                    </div>
                  </div>
                  {isTargetMatched(item) ? (
                    <span className="match">
                      <BellRing size={15} aria-hidden="true" />
                      조건 충족
                    </span>
                  ) : (
                    <span className="tag">대기</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <aside className="panel">
            <h2>프로필</h2>
            <p>
              {session.profile.display_name ?? "이름 없음"} 계정은 {session.profile.preferred_country}/
              {session.profile.preferred_currency} 기준으로 가격을 확인합니다.
            </p>
            <span className="match">
              <TrendingDown size={15} aria-hidden="true" />
              가격 스냅샷 준비됨
            </span>
            <a className="button" href="/app/profile">
              프로필 수정
            </a>
          </aside>
        </div>

        <section className="section-header">
          <div>
            <h2>스토어별 가격</h2>
            <p>같은 게임을 내부 game으로 묶고 Steam/Epic product 가격을 분리해서 보여줍니다.</p>
          </div>
        </section>

        <section className="game-grid" aria-label="관심 게임 가격">
          {mockWatchlist.map((item) => (
            <GameCard key={item.id} game={item.game} actionLabel="목표 수정" />
          ))}
        </section>
      </main>
    </>
  );
}
