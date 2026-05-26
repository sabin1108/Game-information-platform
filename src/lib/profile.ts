export const supportedCountries = [
  { code: "KR", label: "대한민국" },
  { code: "US", label: "미국" },
  { code: "JP", label: "일본" }
] as const;

export const supportedCurrencies = [
  { code: "KRW", label: "KRW" },
  { code: "USD", label: "USD" },
  { code: "JPY", label: "JPY" }
] as const;

const supportedCountryCodes = new Set(supportedCountries.map((country) => country.code));
const supportedCurrencyCodes = new Set(supportedCurrencies.map((currency) => currency.code));

export type ProfileInput = {
  displayName: string | null;
  preferredCountry: string;
  preferredCurrency: string;
};

export function getDefaultDisplayName(email?: string | null) {
  const fallback = "Game Deal Watch 사용자";

  if (!email) {
    return fallback;
  }

  const localPart = email.split("@")[0]?.trim();

  return localPart || fallback;
}

export function parseProfileFormData(formData: FormData): ProfileInput {
  const displayNameValue = String(formData.get("displayName") ?? "").trim();
  const preferredCountry = String(formData.get("preferredCountry") ?? "KR").toUpperCase();
  const preferredCurrency = String(formData.get("preferredCurrency") ?? "KRW").toUpperCase();

  if (displayNameValue.length > 40) {
    throw new Error("표시 이름은 40자 이하로 입력하세요.");
  }

  if (!supportedCountryCodes.has(preferredCountry as (typeof supportedCountries)[number]["code"])) {
    throw new Error("지원하지 않는 국가입니다.");
  }

  if (!supportedCurrencyCodes.has(preferredCurrency as (typeof supportedCurrencies)[number]["code"])) {
    throw new Error("지원하지 않는 통화입니다.");
  }

  return {
    displayName: displayNameValue || null,
    preferredCountry,
    preferredCurrency
  };
}
