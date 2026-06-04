import React from "react";
import { BrainCircuit, Clock3, Database } from "lucide-react";
import type { PublicAiInsight } from "@/lib/ai-insights";

type AiInsightSectionProps = {
  insights: PublicAiInsight[];
  warning?: string;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "생성 시간 없음";
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

export function AiInsightSection({ insights, warning }: AiInsightSectionProps) {
  return (
    <section className="insight-section" aria-labelledby="ai-insights-title">
      <div className="section-header section-header--compact">
        <div>
          <h2 id="ai-insights-title">이번 주 할인 인사이트</h2>
          <p>저장된 가격 snapshot과 리뷰 근거로 만든 요약입니다.</p>
        </div>
      </div>

      {warning ? <div className="notice" role="alert">{warning}</div> : null}

      {insights.length ? (
        <div className="insight-grid">
          {insights.map((insight) => (
            <article className="insight-card" key={insight.id}>
              <div className="insight-card__heading">
                <span className="match">
                  <BrainCircuit size={15} aria-hidden="true" />
                  {insight.gameTitle}
                </span>
                {insight.isStale ? <span className="tag">근거 오래됨</span> : null}
              </div>
              <h3>{insight.title}</h3>
              <p>{insight.summary}</p>
              <div className="insight-card__meta">
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {formatDateTime(insight.generatedAt)}
                </span>
                <span>
                  <Database size={14} aria-hidden="true" />
                  {insight.evidenceLabel}
                </span>
              </div>
              {insight.staleReason ? <p className="insight-card__stale">{insight.staleReason}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <BrainCircuit size={18} aria-hidden="true" />
          저장된 AI 할인 인사이트가 없습니다.
        </div>
      )}
    </section>
  );
}
