import { redirect } from "next/navigation";
import { Mail, Save, UserCircle } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { isSupabaseConfigured } from "@/lib/env";
import { supportedCountries, supportedCurrencies } from "@/lib/profile";
import { getOrCreateProfile, type Profile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
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

async function getProfileState() {
  if (!isSupabaseConfigured()) {
    return {
      demoMode: true,
      email: "demo@example.com",
      profile: demoProfile
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/app/profile");
  }

  return {
    demoMode: false,
    email: user.email ?? "",
    profile: await getOrCreateProfile(supabase, user)
  };
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [{ error, message }, state] = await Promise.all([searchParams, getProfileState()]);

  return (
    <>
      <TopNav isAuthenticated />
      <main className="container">
        <section className="section-header">
          <div>
            <h1>프로필</h1>
            <p>로그인 이메일, 표시 이름, 기본 국가와 통화를 관리합니다.</p>
          </div>
          <a className="button" href="/app">
            내 목록
          </a>
        </section>

        <div className="profile-grid">
          <section className="panel profile-summary" aria-label="계정 정보">
            <span className="profile-avatar">
              <UserCircle size={34} aria-hidden="true" />
            </span>
            <div>
              <h2>{state.profile.display_name ?? "이름 없음"}</h2>
              <p>
                <Mail size={15} aria-hidden="true" />
                {state.email}
              </p>
            </div>
            {state.demoMode ? <div className="notice">Supabase 미설정 데모 프로필입니다.</div> : null}
          </section>

          <section className="panel">
            <h2>프로필 수정</h2>
            {error ? <div className="notice">{error}</div> : null}
            {message ? <div className="notice notice--success">{message}</div> : null}
            <form className="form-stack" action={updateProfile}>
              <div className="field">
                <label htmlFor="displayName">표시 이름</label>
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  maxLength={40}
                  defaultValue={state.profile.display_name ?? ""}
                  disabled={state.demoMode}
                />
              </div>

              <div className="field">
                <label htmlFor="preferredCountry">기본 국가</label>
                <select
                  id="preferredCountry"
                  name="preferredCountry"
                  defaultValue={state.profile.preferred_country}
                  disabled={state.demoMode}
                >
                  {supportedCountries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="preferredCurrency">기본 통화</label>
                <select
                  id="preferredCurrency"
                  name="preferredCurrency"
                  defaultValue={state.profile.preferred_currency}
                  disabled={state.demoMode}
                >
                  {supportedCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              <button className="button button--primary" type="submit" disabled={state.demoMode}>
                <Save size={17} aria-hidden="true" />
                저장
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
