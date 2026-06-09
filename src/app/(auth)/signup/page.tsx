import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
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
    <AuthPageShell
      description="이메일로 시작하고, 관심 목록은 내 계정에만 저장합니다."
      error={error}
      footer={<>이미 계정이 있나요? <a href="/login">로그인</a></>}
      message={message}
      title="회원가입"
    >
      <AuthForm mode="signup" action={signup} />
    </AuthPageShell>
  );
}
