"use client";

import { useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
  redirectTo?: string;
};

function SubmitButton({ mode }: Pick<AuthFormProps, "mode">) {
  const { pending } = useFormStatus();

  return (
    <button className="button button--primary" type="submit" disabled={pending}>
      {pending ? <LoaderCircle size={17} aria-hidden="true" /> : null}
      {pending ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
    </button>
  );
}

export function AuthForm({ mode, action, redirectTo }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form className="form-stack" action={action}>
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
      <div className="field">
        <label htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <div className="password-field"><input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "signup" ? 8 : undefined}
          aria-describedby={mode === "signup" ? "password-hint" : undefined}
          required
        /><button className="password-toggle" type="button" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></div>
        {mode === "signup" ? <small id="password-hint" className="field-hint">8자 이상으로 입력해 주세요.</small> : null}
      </div>

      <SubmitButton mode={mode} />
    </form>
  );
}
