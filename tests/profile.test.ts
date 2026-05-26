import { describe, expect, it } from "vitest";
import { getDefaultDisplayName, parseProfileFormData } from "@/lib/profile";

describe("profile helpers", () => {
  it("uses the email local part as the default display name", () => {
    expect(getDefaultDisplayName("player@example.com")).toBe("player");
  });

  it("normalizes supported profile form values", () => {
    const formData = new FormData();
    formData.set("displayName", "  sabin  ");
    formData.set("preferredCountry", "kr");
    formData.set("preferredCurrency", "krw");

    expect(parseProfileFormData(formData)).toEqual({
      displayName: "sabin",
      preferredCountry: "KR",
      preferredCurrency: "KRW"
    });
  });

  it("rejects unsupported countries", () => {
    const formData = new FormData();
    formData.set("preferredCountry", "ZZ");
    formData.set("preferredCurrency", "KRW");

    expect(() => parseProfileFormData(formData)).toThrow("지원하지 않는 국가입니다.");
  });
});
