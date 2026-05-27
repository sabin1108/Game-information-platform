import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";
import { isSupabaseConfigured } from "@/lib/env";
import { signup } from "./actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, message } = await searchParams;

  return (
    <>
      <TopNav />
      <main className="auth-shell">
        <section className="auth-card">
          <h1>회원가입</h1>
          <p>이메일로 시작하고, 관심 목록은 내 계정에만 저장합니다.</p>
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
          <AuthForm mode="signup" action={signup} />
          <p>
            이미 계정이 있나요? <a href="/login">로그인</a>
          </p>
        </section>
      </main>
    </>
  );
}
