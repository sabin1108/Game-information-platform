# 실험 문서

## `popular-card-density`

목표: 인기 게임 카드를 더 촘촘하게 보여주면 스토어 클릭 의도가 증가하는지 확인한다. 단, 관심 목록 추가 전환이 떨어지면 안 된다.

변형:

- `control`: 기존 데스크톱 3열 인기 카드 레이아웃.
- `variant_a`: 카드 간격을 줄인 데스크톱 4열 인기 카드 레이아웃.

배정 방식:

- 로그인 사용자는 Supabase user id 기준으로 배정한다.
- 비로그인 사용자는 `gdw_anonymous_id` 쿠키 기준으로 배정한다.
- 배정 hash는 결정적이다. 같은 사용자 또는 같은 익명 세션은 항상 같은 variant를 받는다.

노출 이벤트:

- 이벤트 이름: `experiment_exposure`
- 속성: `experiment_key`, `variant`, `subject_type`, `primary_metric`, `guardrail_metric`

주요 지표:

- `deal_click`: 사용자가 스토어 가격 행 또는 기본 스토어 열기 버튼을 클릭한다.

가드레일 지표:

- `watchlist_add`: 사용자가 게임을 관심 목록에 추가한다. 스토어 클릭 최적화 중에도 이 지표는 감소하면 안 된다.

운영 규칙:

- PostHog capture는 `NEXT_PUBLIC_POSTHOG_TOKEN`과 `NEXT_PUBLIC_POSTHOG_HOST`가 모두 설정된 경우에만 실행한다.
- PostHog 설정이 없으면 analytics 호출은 no-op으로 처리한다.
- analytics 실패는 검색, 할인, 스토어 클릭, 로그인, 관심 목록 흐름을 막으면 안 된다.
