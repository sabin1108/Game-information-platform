import type { PopularCardVariant } from "@/lib/analytics/events";

export function assignPopularCardVariant(subjectId: string): PopularCardVariant {
  let hash = 0;

  for (let index = 0; index < subjectId.length; index += 1) {
    hash = (hash * 31 + subjectId.charCodeAt(index)) >>> 0;
  }

  return hash % 2 === 0 ? "control" : "variant_a";
}
