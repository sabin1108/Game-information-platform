import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
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
      footer={<>계정이 없나요? <a href="/signup">회원가입</a></>}
      message={message}
      title="로그인"
    >
      <AuthForm mode="login" action={login} redirectTo={next} />
    </AuthPageShell>
  );
}
