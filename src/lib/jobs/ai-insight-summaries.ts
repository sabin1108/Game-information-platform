import type { AiInsightCandidate } from "@/lib/jobs/ai-insight-candidates";

export type AiInsightSummary = {
  modelName: string;
  title: string;
  summary: string;
};

const MOCK_MODEL_NAME = "mock-evidence-summarizer-v1";
const MAX_SUMMARY_LENGTH = 280;

function formatPercent(value: number | null) {
  return `${value ?? 0}%`;
}

function formatPrice(value: number | null, currency: string) {
  if (!value || value <= 0) {
    return `${currency} 가격 미정`;
  }

  return `${currency} ${Math.round(value / 100).toLocaleString("ko-KR")}`;
}

export function createEvidenceOnlyPrompt(candidate: AiInsightCandidate) {
  return [
    "You summarize a game deal insight using only the evidence JSON.",
    "Do not invent prices, discounts, review counts, dates, or stores.",
    "Return one short Korean title and one Korean summary.",
    `Evidence JSON: ${JSON.stringify(candidate.evidence)}`
  ].join("\n");
}

export function summarizeCandidateWithMock(candidate: AiInsightCandidate): AiInsightSummary {
  const evidence = candidate.evidence;
  const discount = formatPercent(evidence.discountPercent);
  const current = formatPrice(evidence.currentPriceCents, evidence.currency);
  const regular = formatPrice(evidence.regularPriceCents, evidence.currency);
  const titleByType: Record<AiInsightCandidate["insightType"], string> = {
    historical_low: "역대 최저가 후보",
    deep_discount: "큰 폭 할인 후보",
    high_review_discount: "리뷰가 검증한 할인 후보"
  };

  return validateAiInsightSummary({
    modelName: MOCK_MODEL_NAME,
    title: `${evidence.title} ${titleByType[candidate.insightType]}`,
    summary: `${evidence.title}은 저장된 ${evidence.store} snapshot 기준 ${discount} 할인입니다. 현재가는 ${current}, 정가는 ${regular}이며 근거 관측 시각은 ${evidence.observedAt}입니다.`
  });
}

export function validateAiInsightSummary(summary: AiInsightSummary): AiInsightSummary {
  const title = summary.title.trim();
  const body = summary.summary.trim();

  if (!summary.modelName.trim()) {
    throw new Error("AI insight summary model name is required.");
  }

  if (!title) {
    throw new Error("AI insight title is required.");
  }

  if (!body || body.length > MAX_SUMMARY_LENGTH) {
    throw new Error(`AI insight summary must be between 1 and ${MAX_SUMMARY_LENGTH} characters.`);
  }

  return {
    modelName: summary.modelName.trim(),
    title,
    summary: body
  };
}
