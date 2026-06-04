import { afterEach, describe, expect, it, vi } from "vitest";

describe("environment validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("rejects Supabase dashboard URLs", async () => {
    const { isValidSupabaseUrl } = await import("@/lib/env");

    expect(isValidSupabaseUrl("https://supabase.com/dashboard/project/example")).toBe(false);
  });

  it("accepts Supabase project API URLs", async () => {
    const { isValidSupabaseUrl } = await import("@/lib/env");

    expect(isValidSupabaseUrl("https://example.supabase.co")).toBe(true);
  });

  it("keeps ITAD disabled on localhost development unless explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("ITAD_API_KEY", "server-only-secret");
    vi.stubEnv("ITAD_ENABLE_LOCAL_DEV", "");

    const { isItadConfigured } = await import("@/lib/env");

    expect(isItadConfigured()).toBe(false);
  });

  it("allows ITAD on localhost development when enabled", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("ITAD_API_KEY", "server-only-secret");
    vi.stubEnv("ITAD_ENABLE_LOCAL_DEV", "true");

    const { isItadConfigured } = await import("@/lib/env");

    expect(isItadConfigured()).toBe(true);
  });
});
