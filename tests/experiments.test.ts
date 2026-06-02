import { describe, expect, it } from "vitest";
import { assignPopularCardVariant } from "@/lib/experiment-assignment";

describe("popular card experiment assignment", () => {
  it("keeps the same variant for the same subject", () => {
    const subject = "popular-card-density:user-123";

    expect(assignPopularCardVariant(subject)).toBe(assignPopularCardVariant(subject));
  });

  it("assigns only supported variants", () => {
    const variants = new Set(
      ["anonymous-a", "anonymous-b", "user-a", "user-b"].map((subject) =>
        assignPopularCardVariant(`popular-card-density:${subject}`)
      )
    );

    for (const variant of variants) {
      expect(["control", "variant_a"]).toContain(variant);
    }
  });
});
