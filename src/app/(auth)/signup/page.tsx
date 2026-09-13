import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
import { getAuthPageHref, getSafeAuthRedirect } from "@/lib/auth-navigation";
import { signup } from "./actions";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, message, next } = await searchParams;
  const redirectTo = getSafeAuthRedirect(next, "/app");

  return (
    <AuthPageShell
      description="이메일로 시작하고, 관심 목록은 내 계정에만 저장합니다."
      error={error}
      footer={<a className="button button--secondary" href={getAuthPageHref("/login", redirectTo)}>로그인으로 돌아가기</a>}
      message={message}
      title="회원가입"
    >
      <AuthForm mode="signup" action={signup} redirectTo={redirectTo} />
    </AuthPageShell>
  );
}
