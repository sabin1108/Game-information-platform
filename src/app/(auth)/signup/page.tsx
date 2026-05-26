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
          <p>이메일/비밀번호 인증으로 시작하고, 이후 Google과 Steam 연동을 추가합니다.</p>
          {!isSupabaseConfigured() ? (
            <div className="notice">
              Supabase 환경변수가 없어 회원가입 제출 시 데모 대시보드로 이동합니다.
            </div>
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
