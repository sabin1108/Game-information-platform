import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ isSupabaseConfigured: () => true }));
const exchange = vi.hoisted(() => vi.fn(async () => ({ error: null })));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: exchange } }) }));
import { GET } from "@/app/auth/callback/route";

describe("email confirmation callback", () => {
  it("exchanges the code and returns to the filtered page", async () => {
    const params = new URLSearchParams({ code: "test-code", next: "/search?q=hades&store=steam" });
    const response = await GET(new NextRequest("https://example.com/auth/callback?" + params));
    expect(exchange).toHaveBeenCalledWith("test-code");
    expect(response.headers.get("location")).toBe("https://example.com/search?q=hades&store=steam");
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example"]) ("keeps invalid destinations on the site: %s", async (next) => {
    const response = await GET(new NextRequest("https://example.com/auth/callback?" + new URLSearchParams({ next })));
    expect(response.headers.get("location")).toBe("https://example.com/app");
  });
});
