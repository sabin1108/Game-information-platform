export function formatPrice(cents: number, currency: string) {
  if (currency === "KRW") {
    return `${new Intl.NumberFormat("ko-KR", {
      maximumFractionDigits: 0
    }).format(cents / 100)}원`;
  }

  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(cents / 100);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function formatKoreanDateTime(value: string | null, fallback?: string) {
  if (!value) {
    return fallback ?? "";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
