import { SearchX } from "lucide-react";
import { TopNav } from "@/components/top-nav";
export default function NotFound() {
  return <><TopNav /><main id="main-content" className="container" tabIndex={-1}><section className="empty-state empty-state--full not-found"><SearchX size={40} aria-hidden="true" /><span className="eyebrow">404</span><h1>이 페이지를 찾을 수 없어요</h1><p>주소가 변경되었거나 없는 페이지입니다. 새로운 할인을 찾아볼까요?</p><div className="form-actions"><a className="button button--primary" href="/">홈으로</a><a className="button" href="/deals">할인 둘러보기</a></div></section></main></>;
}
