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
