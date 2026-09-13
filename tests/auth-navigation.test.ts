import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ loginError: null as null | { message: string }, hasSession: true, signupOptions: null as null | { emailRedirectTo: string } }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error("REDIRECT:" + path); } }));
vi.mock("@/lib/env", () => ({ env: { appUrl: "https://example.com" }, isSupabaseConfigured: () => true, shouldSkipEmailConfirmationInDev: () => false }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: {
  signInWithPassword: async () => ({ error: state.loginError }),
  signUp: async ({ options }: { options: { emailRedirectTo: string } }) => { state.signupOptions = options; return { data: { session: state.hasSession ? {} : null }, error: null }; }
} }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { login } from "@/app/(auth)/login/actions";
import { signup } from "@/app/(auth)/signup/actions";
const next = "/search?q=hades&store=steam";
function form(path = next) { const data = new FormData(); data.set("email", "player@example.com"); data.set("password", "example-password"); data.set("redirectTo", path); return data; }
beforeEach(() => { state.loginError = null; state.hasSession = true; state.signupOptions = null; });

describe("auth navigation preserves intent", () => {
  it("returns to the same filtered page after login", async () => {
    await expect(login(form())).rejects.toThrow("REDIRECT:" + next);
  });
  it("keeps the destination when login fails", async () => {
    state.loginError = { message: "Invalid credentials" };
    expect.hasAssertions();
    try { await login(form()); } catch (error) {
      const url = new URL((error as Error).message.replace("REDIRECT:", ""), "https://example.com");
      expect(url.pathname).toBe("/login");
      expect(url.searchParams.get("next")).toBe(next);
      expect(url.searchParams.get("error")).toBeTruthy();
    }
  });
  it("returns to the same filtered page after signup", async () => {
    await expect(signup(form())).rejects.toThrow("REDIRECT:" + next);
    const callback = new URL(state.signupOptions!.emailRedirectTo);
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe(next);
  });
  it("preserves the destination while waiting for email verification", async () => {
    state.hasSession = false;
    expect.hasAssertions();
    try { await signup(form()); } catch (error) {
      const url = new URL((error as Error).message.replace("REDIRECT:", ""), "https://example.com");
      expect(url.pathname).toBe("/login");
      expect(url.searchParams.get("next")).toBe(next);
      expect(url.searchParams.get("message")).toBeTruthy();
    }
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/auth/callback"]) ("rejects an unsafe or unsupported destination: %s", async (path) => {
    await expect(login(form(path))).rejects.toEqual(new Error("REDIRECT:/"));
  });
});
