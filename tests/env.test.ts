import { describe, expect, it } from "vitest";
import { isValidSupabaseUrl } from "@/lib/env";

describe("environment validation", () => {
  it("rejects Supabase dashboard URLs", () => {
    expect(isValidSupabaseUrl("https://supabase.com/dashboard/project/example")).toBe(false);
  });

  it("accepts Supabase project API URLs", () => {
    expect(isValidSupabaseUrl("https://example.supabase.co")).toBe(true);
  });
});
