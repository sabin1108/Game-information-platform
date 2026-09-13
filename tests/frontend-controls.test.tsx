import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth-form";
import { FeedNotice } from "@/components/feed-notice";
afterEach(cleanup);

describe("frontend controls", () => {
  it("toggles password visibility without changing the password", () => {
    render(<AuthForm mode="signup" action={vi.fn()} />);
    const field = screen.getByLabelText("비밀번호") as HTMLInputElement;
    fireEvent.change(field, { target: { value: "secret-value" } });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 표시" }));
    expect(field.type).toBe("text");
    expect(field.value).toBe("secret-value");
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 숨기기" }));
    expect(field.type).toBe("password");
  });
  it("clearly labels example and delayed data without exposing provider errors", () => {
    const { rerender } = render(<FeedNotice source="mock" warning="private provider diagnostic" />);
    expect(screen.getByRole("status").textContent).toContain("예시 게임");
    expect(screen.queryByText("private provider diagnostic")).toBeNull();
    rerender(<FeedNotice source="itad" stale />);
    expect(screen.getByRole("status").textContent).toContain("갱신이 지연");
    rerender(<FeedNotice source="itad" />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
