import { Info } from "lucide-react";

type FeedNoticeProps = { source: "mock" | "itad"; stale?: boolean; warning?: string };

export function FeedNotice({ source, stale, warning }: FeedNoticeProps) {
  if (source !== "mock" && !stale && !warning) return null;
  return <div className="data-notice" role="status"><Info size={17} aria-hidden="true" /><p>{source === "mock"
    ? "예시 게임 목록을 보여드리고 있어요. 일부 가격은 실제 판매가와 다를 수 있습니다."
    : stale ? "가격 갱신이 지연되어 마지막으로 확인한 정보를 보여드리고 있어요."
    : "일부 정보를 갱신하지 못했어요. 구매 전 스토어에서 가격을 확인해 주세요."}</p></div>;
}
