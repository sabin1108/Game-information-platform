"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
};

function SubmitButton({ mode }: Pick<AuthFormProps, "mode">) {
  const { pending } = useFormStatus();

  return (
    <button className="button button--primary" type="submit" disabled={pending}>
      {pending ? <LoaderCircle size={17} aria-hidden="true" /> : null}
      {mode === "login" ? "로그인" : "회원가입"}
    </button>
  );
}

export function AuthForm({ mode, action }: AuthFormProps) {
  return (
    <form className="form-stack" action={action}>
      <div className="field">
        <label htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          required
        />
      </div>

      <SubmitButton mode={mode} />
    </form>
  );
}
