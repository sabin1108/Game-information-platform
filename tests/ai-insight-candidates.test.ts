import { describe, expect, it } from "vitest";
import {
  buildDeterministicInsightCandidates,
  type StoredInsightSnapshot
} from "@/lib/jobs/ai-insight-candidates";
import {
  createEvidenceOnlyPrompt,
  summarizeCandidateWithMock,
  validateAiInsightSummary
} from "@/lib/jobs/ai-insight-summaries";

function snapshot(input: Partial<StoredInsightSnapshot>): StoredInsightSnapshot {
  return {
    snapshotId: "snapshot-1",
    productId: "product-1",
    gameId: "game-1",
    title: "Hades II",
    store: "steam",
    country: "KR",
    currency: "KRW",
    regularPriceCents: 32_000,
    currentPriceCents: 16_000,
    discountPercent: 50,
    isHistoricalLow: false,
    observedAt: "2026-06-04T00:00:00.000Z",
    steamReviewCount: 12_000,
    steamPositiveRatio: 91,
    ...input
  };
}

describe("AI insight deterministic candidates", () => {
  it("creates multiple candidates only from stored snapshot evidence", () => {
    const candidates = buildDeterministicInsightCandidates([
      snapshot({
        isHistoricalLow: true,
        discountPercent: 60
      })
    ]);

    expect(candidates.map((candidate) => candidate.insightType)).toEqual(
      expect.arrayContaining(["historical_low", "deep_discount", "high_review_discount"])
    );
    expect(candidates[0]).toMatchObject({
      gameId: "game-1",
      evidence: {
        snapshotId: "snapshot-1",
        currentPriceCents: 16_000,
        regularPriceCents: 32_000,
        discountPercent: 60
      }
    });
  });

  it("does not create candidates when source snapshot price evidence is missing", () => {
    expect(
      buildDeterministicInsightCandidates([
        snapshot({
          snapshotId: "",
          currentPriceCents: null,
          regularPriceCents: null,
          discountPercent: null,
          isHistoricalLow: true
        })
      ])
    ).toEqual([]);
  });

  it("keeps high-review discount behind review and discount thresholds", () => {
    const candidates = buildDeterministicInsightCandidates([
      snapshot({
        discountPercent: 20,
        steamReviewCount: 999,
        steamPositiveRatio: 91
      }),
      snapshot({
        snapshotId: "snapshot-2",
        productId: "product-2",
        gameId: "game-2",
        discountPercent: 20,
        steamReviewCount: 1_000,
        steamPositiveRatio: 75
      })
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      gameId: "game-2",
      insightType: "high_review_discount"
    });
  });
});

describe("AI insight summaries", () => {
  it("builds a prompt from evidence JSON and mock-summarizes without inventing new prices", () => {
    const [candidate] = buildDeterministicInsightCandidates([
      snapshot({
        isHistoricalLow: true,
        discountPercent: 60,
        currentPriceCents: 12_800,
        regularPriceCents: 32_000
      })
    ]);
    const prompt = createEvidenceOnlyPrompt(candidate);
    const summary = summarizeCandidateWithMock(candidate);

    expect(prompt).toContain("Evidence JSON:");
    expect(prompt).toContain("\"currentPriceCents\":12800");
    expect(summary.modelName).toBe("mock-evidence-summarizer-v1");
    expect(summary.summary).toContain("60% 할인");
    expect(summary.summary).toContain("KRW 128");
    expect(summary.summary).not.toContain("무료");
  });

  it("validates required summary fields and length", () => {
    expect(() =>
      validateAiInsightSummary({
        modelName: "",
        title: "제목",
        summary: "요약"
      })
    ).toThrow("model name");

    expect(() =>
      validateAiInsightSummary({
        modelName: "mock",
        title: "제목",
        summary: "x".repeat(281)
      })
    ).toThrow("between 1 and 280");
  });
});
