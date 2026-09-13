import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
import { getAuthPageHref, getSafeAuthRedirect } from "@/lib/auth-navigation";
import { login } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message, next } = await searchParams;

  return (
    <AuthPageShell
      description="관심 게임과 목표 가격을 계정에 저장합니다."
      error={error}
      footer={<a className="button button--secondary" href={getAuthPageHref("/signup", getSafeAuthRedirect(next, "/app"))}>이메일로 회원가입</a>}
      message={message}
      title="로그인"
    >
      <AuthForm mode="login" action={login} redirectTo={getSafeAuthRedirect(next)} />
    </AuthPageShell>
  );
}
