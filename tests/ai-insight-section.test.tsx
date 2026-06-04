import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiInsightSection } from "@/components/ai-insight-section";
import type { PublicAiInsight } from "@/lib/ai-insights";

function insight(input: Partial<PublicAiInsight> = {}): PublicAiInsight {
  return {
    id: "insight-1",
    gameId: "game-1",
    gameTitle: "Hades II",
    insightType: "deep_discount",
    title: "Hades II 할인 주목",
    summary: "리뷰와 할인율 근거가 함께 저장된 인사이트입니다.",
    confidence: 0.9,
    createdAt: "2026-06-04T00:00:00.000Z",
    generatedAt: "2026-06-04T00:01:00.000Z",
    isStale: false,
    staleReason: null,
    evidence: {
      store: "steam",
      currency: "KRW",
      currentPriceCents: 12_800,
      discountPercent: 60,
      observedAt: "2026-06-04T00:00:00.000Z"
    },
    evidenceLabel: "STEAM · 12,800원 · -60%",
    ...input
  };
}

describe("AiInsightSection", () => {
  it("shows an empty state when no insights exist", () => {
    render(<AiInsightSection insights={[]} />);

    expect(screen.getByText("저장된 AI 할인 인사이트가 없습니다.")).toBeTruthy();
  });

  it("renders title, summary, generated time, evidence, and stale state", () => {
    render(
      <AiInsightSection
        insights={[
          insight({
            isStale: true,
            staleReason: "근거 가격 snapshot이 7일보다 오래되었습니다.",
            evidenceLabel: "STEAM · -60%"
          })
        ]}
      />
    );

    expect(screen.getByText("Hades II 할인 주목")).toBeTruthy();
    expect(screen.getByText("리뷰와 할인율 근거가 함께 저장된 인사이트입니다.")).toBeTruthy();
    expect(screen.getByText("근거 오래됨")).toBeTruthy();
    expect(screen.getByText("STEAM · -60%")).toBeTruthy();
    expect(screen.getByText("근거 가격 snapshot이 7일보다 오래되었습니다.")).toBeTruthy();
  });
});
