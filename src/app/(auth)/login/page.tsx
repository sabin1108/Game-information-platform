import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";
import { isSupabaseConfigured } from "@/lib/env";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <>
      <TopNav />
      <main className="auth-shell">
        <section className="auth-card">
          <h1>로그인</h1>
          <p>관심 게임과 목표 가격을 계정에 저장합니다.</p>
          {!isSupabaseConfigured() ? (
            <div className="notice">Supabase 설정이 없어 데모 대시보드로 이동합니다.</div>
          ) : null}
          {error ? (
            <div className="notice" role="alert">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="notice notice--success" role="status">
              {message}
            </div>
          ) : null}
          <AuthForm mode="login" action={login} />
          <p>
            계정이 없나요? <a href="/signup">회원가입</a>
          </p>
        </section>
      </main>
    </>
  );
}
