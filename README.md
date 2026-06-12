# Game Deal Watch

Steam과 Epic Games 가격을 한 화면에서 비교하고, 관심 게임의 목표 가격/할인율 도달 여부를 추적하는 게임 할인 정보 플랫폼입니다. 단순 목록형 페이지가 아니라 검색, 할인 탐색, 관심 목록, 목표 조건 저장, 추천, AI 인사이트, 웹뷰 대응, 분석/모니터링까지 이어지는 제품 경험으로 구성했습니다.

배포 사이트: https://www.gamesaleinfo.site/

## 화면 구성

### 홈 / 인기 게임 / AI 인사이트

![홈 인기 게임과 AI 인사이트](https://i.postimg.cc/Wz0JsZyn/gameinfo-1.png)

- 인기 게임 카드에서 Steam/Epic 가격, 할인율, 리뷰 반응, 태그를 함께 확인합니다.
- 저장된 가격 snapshot과 리뷰 근거가 있을 때 AI 할인 인사이트를 홈에 노출합니다.
- 관심 목록 추가 CTA를 카드 안에 배치해 검색 전환 없이 바로 저장할 수 있게 했습니다.

### 관심 목록 / 목표 조건 / 추천

![관심 목록과 태그 기반 추천](https://i.postimg.cc/CM88CyKd/gameinfo-2.png)

- 관심 게임을 Steam/Epic 상품 단위로 묶고 최신 가격 기준으로 목표 조건을 계산합니다.
- 목표 조건을 만족한 항목은 우선 확인할 수 있고, 태그 기반 추천 후보를 함께 보여줍니다.
- 스토어 열기 액션은 일반 웹 링크와 모바일 웹뷰 bridge fallback을 모두 고려했습니다.

### 검색 / 필터 / 결과 카드

![검색과 필터 결과](https://i.postimg.cc/SQ99L0Ks/gameinfo-3.png)

- 검색어, 태그/장르, 스토어 필터를 URL query 기반으로 적용합니다.
- 검색 API는 외부 API key를 브라우저에 노출하지 않고 서버 route에서 정규화한 결과만 반환합니다.
- 검색 결과에서도 동일한 카드 컴포넌트와 관심 목록 추가 흐름을 사용합니다.

### 목표 가격 / 목표 할인율 편집

![목표 조건 편집](https://i.postimg.cc/7Pzz1vLY/gameinfo-4.png)

- 관심 목록 항목마다 목표 가격, 목표 할인율, 메모를 저장합니다.
- Server Action에서 로그인 사용자 본인의 watchlist item만 수정하도록 `itemId`와 `userId`를 함께 검증합니다.
- 현재가가 0원인 출시 예정 게임은 조건 충족으로 오판하지 않도록 계산 로직을 분리해 테스트했습니다.

## 주요 기능 구현

| 영역 | 구현 내용 | 대표 파일 |
| --- | --- | --- |
| 인증/프로필 | Supabase email/password 회원가입, 로그인, 로그아웃, 보호 route, 프로필 저장 | `src/app/(auth)`, `src/lib/supabase` |
| 공개 홈 | 인기 게임 피드, 검색 진입, AI 인사이트 섹션 | `src/app/page.tsx`, `src/lib/game-feeds.ts` |
| 검색 | ITAD 검색 응답 정규화, 태그/스토어 필터, TTL cache, 최근 검색어 저장 | `src/app/api/search/route.ts`, `src/lib/search.ts` |
| 할인 탐색 | 할인율/가격/스토어/태그 필터, 무한 로드, cache metadata | `src/app/deals/page.tsx`, `src/components/deal-feed.tsx` |
| 관심 목록 | 게임/스토어 상품/가격 snapshot 저장, 중복 방지, soft delete | `src/lib/watchlist.ts`, `src/app/api/watchlist/route.ts` |
| 목표 조건 | 목표 가격/할인율/메모 저장, 조건 충족 정렬/필터 | `src/components/watchlist-target-form.tsx`, `src/lib/game-score.ts` |
| 추천 | 관심 목록 태그와 최근 검색어 기반 가중치 추천 | `src/lib/recommendations.ts` |
| AI 인사이트 | job route, deterministic 후보 생성, evidence-only 요약 저장/노출 | `src/lib/jobs/ai-insights.ts`, `src/components/ai-insight-section.tsx` |
| 웹뷰 대응 | `?webview=1`, safe-area, 하단 탭, 외부 스토어 bridge payload | `src/components/webview-mode.tsx`, `src/lib/webview-bridge.ts` |
| 분석/A/B 테스트 | PostHog-compatible 이벤트 taxonomy, popular-card-density 실험, exposure/click/conversion 이벤트 | `src/lib/analytics/events.ts`, `src/lib/experiments.ts` |
| 모니터링 | Sentry DSN 기반 no-op 안전 처리, Web Vitals, API duration/cache/status header | `src/lib/monitoring`, `src/components/monitoring-bootstrap.tsx` |

## 테스트와 검증 방식

자동화는 기능의 일부로 다뤘습니다. 사용자가 실제로 보는 이름, 버튼, URL, status/alert 상태를 기준으로 회귀를 막도록 구성했습니다.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
npm run e2e:smoke
npm run analyze
npm run load:public
```

- Vitest: API route, 정규화, cache, rate limit, 추천, 목표 조건 계산, analytics payload, monitoring, AI insight 후보/저장 흐름 검증
- Testing Library: 게임 카드, 관심 목록 추가 폼, 목표 조건 폼, AI 인사이트 섹션 등 사용자-facing 컴포넌트 검증
- Playwright: 홈 smoke, auth flow, watchlist flow, 모바일 웹뷰 safe-area/bridge fallback 검증
- Load smoke: home/search/deals public API를 mock/cache 경로로 반복 호출해 status, cache, p50/p95/max latency를 기록할 수 있게 구성

최근 정리 기준으로 `tests` 아래에는 unit/component/API/E2E spec 25개 파일이 있고, `test`/`it` 케이스는 69개입니다. 마지막 주요 리팩터 검증에서는 `npm test` 기준 21 files / 60 tests가 통과했습니다.

### 기능별 테스트 범위

| 테스트 대상 | 테스트 방식 | 검증한 내용 |
| --- | --- | --- |
| 검색 API | Vitest API test | ITAD 응답 정규화, query/tag/store 필터, cache hit/miss, server-only API key 비노출 |
| 할인 API | Vitest API test | 최소 할인율/최대 가격/스토어/태그/정렬 필터, mock fallback, `X-Deals-Cache` metadata |
| 공개 인기 API | Vitest API test | popular feed 응답 구조, cache status, pagination/filter 입력 처리 |
| rate limit | Vitest unit/API test | 동일 identity 반복 요청 시 `429`, `Retry-After`, `X-RateLimit-*` header 반환 |
| stale-safe cache | Vitest unit/API test | fresh TTL 이후 외부 API 실패 시 마지막 검증 payload를 `stale` 상태로 반환 |
| 관심 목록 추가 | Vitest + Testing Library | 로그인 필요 상태, add button submit, 성공/중복/오류 UI 상태 |
| 관심 목록 저장 로직 | Vitest unit/API test | 게임 catalog, store product, price snapshot, user watchlist row 저장 흐름 |
| 목표 조건 계산 | Vitest unit test | 목표 가격/할인율 충족 여부, 출시 예정처럼 현재가 0원인 항목 오판 방지 |
| 목표 조건 폼 | Testing Library | 목표 가격, 목표 할인율, 메모 입력과 저장/삭제 버튼 상태 |
| 추천 로직 | Vitest unit test | 관심 목록 태그 가중치와 최근 검색어 기반 추천, 이미 찜한 게임 제외 |
| AI insight 후보 | Vitest unit test | `historical_low`, `deep_discount`, `high_review_discount` 후보 생성 조건 |
| AI insight job | Vitest API test | `JOB_SECRET` 인증, dry-run path, run result, 외부 AI 없이 mock summarizer 검증 |
| AI insight UI | Testing Library | 저장된 insight 표시, 빈 상태, 오래된 evidence를 현재가처럼 보여주지 않는 정책 |
| analytics API | Vitest API test | event name validation, payload shape, capture 실패 시 사용자 flow 차단 방지 |
| experiment assignment | Vitest unit test | 동일 사용자/익명 id에 stable variant 배정 |
| monitoring API | Vitest API test | API duration/status/cache header, client/server monitoring event ingest |
| Webview mode | Playwright mobile project | `?webview=1`, safe-area padding, 하단 탭 viewport 적합성 |
| store bridge | Playwright mobile project | native bridge payload 생성, bridge가 없을 때 일반 링크 fallback |
| 홈 smoke | Playwright desktop/mobile | 홈 route load, 인기 카드 노출, 모바일 webview smoke |
| 인증 flow | Playwright desktop | signup/login/logout, 보호 route redirect, 로그인 후 접근 |
| watchlist flow | Playwright desktop | 검색에서 관심 목록 추가, `/app` 대시보드 확인, 목표 조건 저장 흐름 |

### 검증 완료 기준

- 기능 테스트는 단순 implementation detail이 아니라 사용자가 보는 버튼 이름, alert/status 문구, URL, 응답 JSON shape를 기준으로 작성했습니다.
- 외부 API는 테스트에서 직접 과도 호출하지 않고 mock/cache 경로를 사용해 반복 가능한 결과를 만들었습니다.
- secret 관련 테스트는 실제 값을 쓰지 않고, 응답 JSON이나 client bundle에 server-only key가 섞이지 않는지만 확인했습니다.
- E2E는 비용이 큰 전체 suite와 빠른 desktop smoke를 분리했습니다. CI/배포 확인에는 `npm run e2e:smoke`, 모바일 웹뷰까지 포함한 로컬 회귀 확인에는 필요 시 `npm run e2e`를 사용합니다.
- 성능 검증은 `npm run analyze`의 bundle report와 `npm run load:public`의 p50/p95/max latency 기록 템플릿으로 남기도록 했습니다.

## 성능 및 최적화 근거

| 항목 | 수치/정책 | 의미 |
| --- | --- | --- |
| Next bundle analyzer | 홈 route 1.9 kB / first load JS 108 kB | 공개 홈 초기 JS 규모 확인 |
| Next bundle analyzer | 할인 route 2.32 kB / first load JS 108 kB | 할인 탐색 페이지 비용 확인 |
| Next bundle analyzer | 검색 route 471 B / first load JS 107 kB | 검색 페이지 route bundle 확인 |
| 공통 JS | shared first load JS 102 kB | 공통 런타임 예산 추적 |
| Vite card lab | JS 1.35 kB, gzip 0.66 kB | 카드 컴포넌트 독립 빌드 산출물 확인 |
| Vite card lab | CSS 1.06 kB, gzip 0.50 kB | UI 패키지 스타일 비용 확인 |
| public cache | fresh TTL 5분, stale retention 6시간 | 외부 API 실패 시 마지막 검증 데이터 fallback |
| public rate limit | 운영 120 requests / 60s, 로컬 240 requests / 60s | 공개 API와 외부 provider 보호 |
| cache capacity | popular 40, deals 80, search 100 entries | process-local cache 메모리 상한 |
| load smoke | 기본 10 iterations / concurrency 2 | 반복 가능한 공개 route 부하 확인 경로 |
| code health | duplication 7.07% -> 2.90% | fallow 기반 중복 제거 후 유지보수성 개선 |

추가 최적화로 카드 이미지 `loading="lazy"`, 무한 피드 `IntersectionObserver` 640px 선로드, 가격 snapshot의 product/observed time index, watchlist user/created index, API request log route/time index를 반영했습니다.

## AI Skill 활용 방식과 성과

이 프로젝트에서 AI skill은 단순 코드 생성 도구가 아니라, 기획을 실행 가능한 이슈로 나누고 구현 결과를 테스트/정적 분석/문서로 검증하는 작업 운영 체계로 사용했습니다.

```txt
아이디어 / 로드맵
  -> PRD와 개발 범위 정리
  -> GitHub issue 단위 분할
  -> 구현 / 테스트 / 리뷰
  -> 정적 분석과 성능 지표 확인
  -> handoff와 evidence 문서화
```

| Skill / Plugin | 사용 이유 | 실제 성과 |
| --- | --- | --- |
| Harness plugin | product, data contract, frontend UX, QA, evidence 관점을 분리하기 위해 사용 | 프로젝트 전용 agent 5개와 skill 5개를 구성해 기능 개발 때마다 API 계약, 웹뷰 UX, 테스트, 문서 증거를 함께 점검 |
| `to-issues` | 큰 roadmap과 parent issue를 한 번에 구현하지 않고 독립 실행 가능한 vertical slice로 쪼개기 위해 사용 | AI insight, scale readiness, analytics, bundle, CI/demo 작업을 #15-#25 GitHub issue로 분할하고 추적 |
| `handoff` | 여러 날짜에 걸친 긴 개발에서 맥락 손실과 반복 판단을 줄이기 위해 사용 | `E:\memory\handoffs`에 issue 상태, 변경 파일, 검증 명령, 남은 리스크, secret 비공개 규칙을 계속 저장 |
| `fallow` | 유지보수성을 감이 아니라 수치로 확인하기 위해 사용 | dead-code, unused export, duplicate clone, complexity hotspot을 측정하고 리팩터링 우선순위를 결정 |
| evidence review | 구현 결과를 설명 가능한 증거로 바꾸기 위해 사용 | bundle report, Vite component lab, CI, E2E smoke, demo guide, load smoke 문서로 연결 |
| `analytics-experiment-guardrails` | 이벤트 이름과 payload가 코드/문서/테스트에서 어긋나지 않게 하기 위해 사용 | `experiment_exposed` 오기를 실제 이벤트명 `experiment_exposure`로 정리하고 analytics taxonomy를 확장 |
| `game-data-contracts` | 외부 API, Supabase, cache, RLS, price snapshot 경계를 유지하기 위해 사용 | AI가 가격을 생성하지 못하도록 저장된 snapshot/review evidence만 사용하는 guardrail을 설정 |
| `caveman`, `caveman-commit`, `caveman-review` | 긴 세션의 보고, 커밋 메시지, diff 위험 점검을 짧게 유지하기 위해 사용 | Conventional Commit 형식과 한국어 요약을 유지하고, 큰 변경 전후로 위험 지점을 빠르게 정리 |

### Harness로 역할을 나눈 방식

Harness는 한 명의 AI가 모든 결정을 뭉뚱그려 처리하지 않도록, 프로젝트에 필요한 관점을 역할별 agent와 skill로 나누는 데 사용했습니다. Game Deal Watch는 단순 UI 프로젝트가 아니라 외부 가격 API, Supabase 인증/DB, 웹뷰, analytics, AI 인사이트, 테스트/배포 증거까지 범위가 넓어 역할 분리가 필요했습니다.

| Harness 역할 | 담당 관점 | 실제로 막은 문제 / 만든 성과 |
| --- | --- | --- |
| `game-deal-product-architect` | 사용자 가치, 기능 범위, roadmap, issue slicing | AI 인사이트, scale readiness, CI/demo 작업을 한 번에 섞지 않고 독립 issue로 분리 |
| `game-data-integration-engineer` | ITAD API, Steam 가격, Supabase, RLS, cache key, price snapshot | API key client 노출 방지, cache key 누락 방지, stale 가격을 현재가처럼 보여주는 문제 차단 |
| `game-webview-frontend-engineer` | 모바일 웹뷰, safe-area, 하단 탭, 외부 스토어 bridge UX | `?webview=1` 모드와 bridge fallback을 문서/테스트 대상으로 고정 |
| `game-deal-qa-observability-engineer` | Vitest, Playwright, analytics, monitoring, regression | 기능 구현 후 `typecheck`, `lint`, `test`, `build`, E2E smoke를 검증 루틴으로 유지 |
| documentation architect | README, demo guide, bundle/load/CI evidence | 기능 설명을 수치와 재현 가능한 명령으로 바꿔 증거화 |

agent와 같은 방식으로 프로젝트 전용 skill도 구성했습니다.

| Harness skill | 사용한 상황 | 결과 |
| --- | --- | --- |
| `game-deal-harness-orchestrator` | 새 기능을 시작하거나 다음 issue 우선순위를 정할 때 | product, data, frontend, QA, evidence 관점을 함께 체크 |
| `game-data-contracts` | 검색/할인 API, price snapshot, AI insight, cache/RLS 변경 시 | AI가 가격을 만들어내지 못하도록 evidence-only guardrail 유지 |
| `analytics-experiment-guardrails` | analytics event, A/B test, Web Vitals, monitoring 변경 시 | event name/payload/docs/tests 불일치 수정 |
| evidence review | README, bundle report, demo guide, load test, CI 문서 작성 시 | “구현했다”를 “어떤 수치와 명령으로 검증했다”로 전환 |
| `webview-ux-qa` | 모바일 viewport, safe-area, store bridge 검증 시 | 웹뷰 모드가 일반 웹 링크 fallback과 함께 동작하도록 점검 |

Harness를 사용한 가장 큰 성과는 작업 누락 방지였습니다. 예를 들어 AI 인사이트 기능을 만들 때 단순 요약 UI만 구현하지 않고, `JOB_SECRET`이 필요한 job route, deterministic 후보 생성, evidence-only prompt, stale snapshot 표시 정책, UI empty state, API/컴포넌트 테스트까지 하나의 흐름으로 묶었습니다. 또한 analytics 작업에서는 문서에 잘못 적힌 `experiment_exposed`와 실제 코드 이벤트명 `experiment_exposure`의 불일치를 찾아 수정했습니다.

결국 Harness는 “AI에게 일을 시키는 도구”가 아니라, 긴 프로젝트에서 같은 품질 기준을 반복 적용하게 만든 역할 분리 시스템이었습니다.

### 수치로 확인한 AI-assisted 개발 성과 (1차 코드베이스 정리 기준)

| 항목 | Before | After | 변화 |
| --- | ---: | ---: | ---: |
| Dead-code failed issues | 14 | 1 | -13 |
| Unused files | 1 | 0 | -1 |
| Unused exports | 11 | 0 | -11 |
| Test-only production dependencies | 1 | 0 | -1 |
| Duplicate clone groups | 24 | 1 | -23 |
| Duplicated lines | 1,006 | 750 | -256 |
| Duplication percentage | 9.4% | 7.1% | -2.3%p |
| Maintainability | 91.3 | 92.1 | +0.8 |

위 수치는 `fallow` 기반 1차 코드베이스 정리 구간의 전후 비교입니다. 이후 기능 추가와 추가 리팩터링이 이어지면서 현재 README의 최신 정리 기준은 duplication `7.07% -> 2.90%`, Vitest `21 files / 60 tests passed`, 전체 test/spec `25개 파일 / 69 cases`로 갱신했습니다.

### AI를 사용하면서 지킨 기준

- secret, service role key, demo password, 실제 env 값은 handoff나 issue에 남기지 않았습니다.
- AI 인사이트 기능은 저장된 price snapshot과 review evidence만 사용하게 해, AI가 가격/할인율을 지어내지 못하도록 제한했습니다.
- 기능 구현 후에는 `typecheck`, `lint`, `test`, `build`, 필요한 경우 Playwright smoke와 load smoke를 실행해 결과를 남겼습니다.

## 아키텍처 요약

```txt
Browser / Webview
  -> Next.js App Router pages
  -> Server Components + small Client Islands
  -> Server Actions / API Routes
  -> Supabase Auth + Postgres
  -> ITAD / Steam price enrichment on server only
  -> Cache, rate limit, analytics, monitoring
```

브라우저는 ITAD API를 직접 호출하지 않습니다. 외부 API key는 server-only env에 두고, 서버 route에서 게임/가격/스토어 상품 구조로 정규화한 결과만 클라이언트에 전달합니다. 로그인 사용자의 관심 목록 mutation은 Supabase 세션과 서버 조건을 함께 검증합니다.

## 구현하면서 중요하게 본 점

- 프론트엔드 화면, 사용자 흐름, 테스트 증거, 성능 수치를 함께 남겼습니다.
- 큰 전역 상태를 도입하지 않고 Server Components, Server Actions, URL state, 작은 client island 위주로 구성했습니다.
- analytics, monitoring, AI, cache, rate limit은 핵심 UX가 실패하지 않도록 fail-open/no-op 경로를 뒀습니다.
- 실제 가격 근거가 없을 때 mock 할인율을 진짜 할인처럼 보여주지 않도록 정책을 바꿨습니다.
- GitHub issue, docs, README, 커밋 설명은 한국어 중심으로 관리하되 env 이름, API header, event name, 파일 경로는 원문을 유지했습니다.

## 운영 및 보안 주의점

- `.env.local`, Supabase service role key, ITAD API key, analytics/monitoring token, 실제 demo password는 문서나 커밋에 포함하지 않습니다.
- 현재 public cache와 rate limit은 process-local in-memory 방식입니다. Vercel/serverless multi-instance에서는 인스턴스별 cache/bucket으로 동작하므로 실제 트래픽이 커지면 Redis 또는 Vercel KV로 이전해야 합니다.
- local load smoke는 기본적으로 `ITAD_ENABLE_LOCAL_DEV=false` 경로를 사용해 외부 API를 직접 과도 호출하지 않게 설계했습니다.
- AI 인사이트는 저장된 price snapshot과 review evidence만 사용해야 하며, 가격이나 할인율을 생성해서는 안 됩니다.
- GitHub issue body/comment에 한글을 업데이트할 때 PowerShell inline string은 깨질 수 있어 UTF-8 파일 또는 Node 기반 업데이트를 사용했습니다.

## 실행 방법

```bash
npm install
npm run dev
```

기본 개발 서버는 `http://localhost:3000`입니다. 실제 Supabase/ITAD/analytics/monitoring 연동은 `.env.example`의 변수 이름을 기준으로 로컬 또는 배포 환경에 별도 설정합니다.

## 기술 스택

- Next.js App Router, React, TypeScript
- Supabase Auth/Postgres
- IsThereAnyDeal API, Steam public price enrichment
- PostHog-compatible analytics/experiments
- Sentry DSN, Web Vitals, API monitoring
- Vitest, Testing Library, Playwright
- Next bundle analyzer, Vite component lab
