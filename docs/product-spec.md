# Game Deal Watch Product Spec

Last updated: 2026-05-26

## 1. Product Goal

Steam과 Epic Games Store의 할인을 한 화면에서 확인하고, 사용자가 직접 만든 관심 목록에 대해 현재 가격과 목표 조건 충족 여부를 보여주는 웹 앱을 만든다.

이 프로젝트는 단순 클론이 아니라 프론트엔드 취업 포트폴리오용으로 설계한다. 따라서 모바일 웹뷰, 인증, DB, 배포, 분석, A/B 테스트, 모니터링, 번들러, 트래픽 대응 경험이 코드와 문서로 증명되어야 한다.

## 2. Target Users

- PC 게임을 Steam과 Epic에서 모두 구매하는 사용자
- 할인율, 최저가, 리뷰 수, 긍정 평가율을 보고 구매 타이밍을 판단하는 사용자
- 관심 게임을 직접 관리하고, 목표 가격이나 목표 할인율에 도달했는지 확인하려는 사용자

## 3. MVP Scope

### Public Home

- 상단 검색창
- 로그인/회원가입 진입 메뉴
- 비로그인 사용자를 위한 인기 게임 피드
- 인기 기준은 MVP에서 Steam 리뷰 지표 중심으로 계산한다.
- 카드에는 가능하면 Steam/Epic 현재 가격과 할인율을 함께 표시한다.

인기 랭킹 기본 계산:

```txt
review_count score
+ positive_review_ratio score
+ current_discount bonus
+ recent_release bonus
```

### Auth

- 이메일/비밀번호 회원가입
- 이메일/비밀번호 로그인
- 세션 유지
- 로그아웃
- 추후 Google 소셜 로그인과 Steam 연동을 추가할 수 있도록 auth provider 의존성을 UI와 분리한다.

### Authenticated Dashboard

- 내 관심 게임 목록
- 관심 게임별 Steam/Epic 가격 비교
- 현재가, 정가, 할인율, 할인 종료일, 최저가 여부 표시
- 목표 가격 또는 목표 할인율 설정
- 목표 조건 충족 시 배지와 필터로 표시

### Search And Add

- 게임 검색
- 검색 결과에서 관심 목록 추가
- 같은 게임의 Steam/Epic 상품은 하나의 내부 게임으로 묶고, 스토어 상품은 별도 product로 연결한다.

### Deals Explore

- Steam/Epic 스토어 필터
- 할인율 필터
- 가격 필터
- 리뷰 수/긍정 평가 기준 정렬
- 관심 목록 추가

### Webview Ready UX

- 모바일 우선 반응형 레이아웃
- 하단 탭 내비게이션
- safe-area inset 대응
- 웹뷰 모드 query parameter: `?webview=1`
- 앱 브릿지 이벤트 명세: `game_opened`, `deal_clicked`, `watchlist_added`, `auth_required`
- 외부 스토어 이동은 웹뷰 내부 이동이 아니라 명시적 external open 이벤트로 처리한다.

## 4. Non-MVP Scope

- Steam 계정 찜 목록 자동 가져오기
- Epic 계정 라이브러리 연동
- 이메일/푸시 알림 발송
- 결제
- 커뮤니티 리뷰 작성
- 모든 PC 스토어 지원

## 5. Stack

- Framework: Next.js App Router, TypeScript
- Styling: Tailwind CSS 또는 CSS Modules. 실제 구현 시 디자인 시스템을 먼저 정한다.
- Auth/DB: Supabase Auth, Supabase Postgres, Row Level Security
- External Data: IsThereAnyDeal API
- Analytics and Experiments: PostHog
- Error Monitoring: Sentry
- Performance Metrics: Web Vitals, Vercel Speed Insights, custom API latency events
- E2E: Playwright with mobile device emulation
- Unit/Component Tests: Vitest, Testing Library
- Deployment: Vercel preview and production environments
- Bundler Experience:
  - Next.js production build and bundle analyzer for Webpack-related analysis
  - Separate Vite-based package or playground for reusable UI components and build comparison

## 6. Portfolio Experience Map

| Hiring requirement | Project evidence to build |
| --- | --- |
| 모바일 앱 내 웹뷰 개발 경험 | `?webview=1` mode, safe-area layout, bridge event contract, external link handling, Playwright mobile viewport tests |
| 프론트엔드 개발부터 배포까지 경험 | Next.js app, Supabase integration, Vercel preview/prod deployments, env var setup, CI checks |
| AI 활용 데이터 분석/자동화 경험 | scheduled analysis job that clusters games, detects unusual discounts, summarizes weekly deal trends, and stores AI insights |
| A/B 테스트 설계 및 분석 | PostHog feature flags, experiment exposure events, conversion events such as `watchlist_add` and `deal_click` |
| 퍼포먼스/에러 모니터링 | Sentry, Web Vitals reporting, Vercel Speed Insights, API latency logs, error rate dashboard |
| Webpack, Vite 등 번들러 사용 | Next bundle analyzer report, dynamic import/code splitting decisions, Vite UI package build |
| 대규모 트래픽 처리 | server-side API cache, DB indexes, stale-while-revalidate strategy, rate limiting, load test script, read-heavy public home optimization |

## 7. Main Screens

### Public

- `/`: public home with search and popular feed
- `/deals`: discount exploration
- `/login`: login
- `/signup`: signup

### Authenticated

- `/app`: watchlist dashboard
- `/app/search`: search and add
- `/app/watchlist/:id`: target price/discount settings
- `/app/settings`: profile, experiment opt-out, webview debug info

## 8. Core Metrics

- Signup conversion rate
- Search to watchlist add rate
- Watchlist item count per user
- Deal click-through rate
- Target condition matched count
- No-result search rate
- Public home card click rate
- P75 and P95 route latency
- Client error rate
- Core Web Vitals by route and device class

## 9. A/B Test Candidates

### Experiment 1: Popular Feed Card Density

- Variant A: compact price-first card
- Variant B: review-first card with larger review badge
- Primary metric: `deal_click`
- Secondary metric: `watchlist_add`
- Guardrail: client error rate and LCP

### Experiment 2: Watchlist CTA Copy

- Variant A: `관심 목록 추가`
- Variant B: `할인 알림 받기`
- Primary metric: `watchlist_add`
- Guardrail: signup completion rate

### Experiment 3: Dashboard Default Sort

- Variant A: target condition matched first
- Variant B: highest discount first
- Primary metric: `deal_click`
- Secondary metric: return visit rate

## 10. AI And Automation Scope

MVP 이후 1차 확장으로 다음 자동화 작업을 만든다.

- 매일 캐시된 가격 데이터를 분석해 비정상적으로 큰 할인, 역사적 최저가 후보, 리뷰 대비 할인 매력도가 높은 게임을 찾는다.
- 주간 리포트 생성: "이번 주 관심 목록에서 구매 타이밍이 좋아진 게임"
- AI 결과는 사용자에게 바로 노출하기 전에 `ai_game_insights` 테이블에 저장하고, 근거 데이터와 생성 시간을 함께 보관한다.

## 11. Traffic And Reliability Strategy

- Public home과 deals는 비로그인 트래픽이 많으므로 server-side cache를 우선 사용한다.
- 외부 API 호출은 Next.js server route에서만 수행하고 브라우저에는 API key를 노출하지 않는다.
- IsThereAnyDeal rate limit을 고려해 동일 query와 country/store 조합은 DB 또는 KV에 TTL cache한다.
- 관심 목록 대시보드는 사용자별 데이터이므로 DB index와 최신 price snapshot 조회 최적화가 중요하다.
- 장애 시 외부 API 최신 호출 실패보다 마지막 캐시 데이터를 보여주는 것이 낫다.

## 12. References

- Next.js App Router: https://nextjs.org/docs/app
- Supabase Auth and RLS: https://supabase.com/docs/guides/auth/auth-deep-dive/auth-row-level-security
- IsThereAnyDeal API: https://docs.isthereanydeal.com/
- PostHog feature flags: https://posthog.com/docs/feature-flags
- PostHog experiments: https://posthog.com/docs/experiments
- Vercel Speed Insights: https://vercel.com/docs/speed-insights
- Playwright mobile emulation: https://playwright.dev/docs/emulation
- Vite production build: https://vite.dev/guide/build
- Next.js bundle analyzer: https://nextjs.org/docs/pages/building-your-application/optimizing/package-bundling
