import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";
import { isSupabaseConfigured } from "@/lib/env";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <>
      <TopNav />
      <main className="auth-shell">
        <section className="auth-card">
          <h1>로그인</h1>
          <p>관심 게임, 목표 가격, 할인 조건을 사용자 계정에 저장합니다.</p>
          {!isSupabaseConfigured() ? (
            <div className="notice">
              Supabase 환경변수가 없어 로그인 제출 시 데모 대시보드로 이동합니다.
            </div>
          ) : null}
          {error ? <div className="notice">{error}</div> : null}
          <AuthForm mode="login" action={login} />
          <p>
            계정이 없나요? <Link href="/signup">회원가입</Link>
          </p>
        </section>
      </main>
    </>
  );
}
