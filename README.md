# Game-information-platform

게임 할인 및 신작 게임, 찜한 게임의 정보를 확인하고 직접 스토어로 연결해주는 사이트입니다.

Steam과 Epic Games Store의 할인, 신작, 출시 예정 게임을 한 화면에서 확인하고 사용자별 관심 목록을 관리하는 Next.js 앱입니다.

## Stack

- Next.js App Router
- TypeScript
- React
- Supabase Auth/Postgres
- IsThereAnyDeal API integration point
- Playwright, Vitest

## Getting Started

```bash
npm install
npm run dev
```

개발 서버 기본 주소는 `http://localhost:3000`입니다. Supabase 없이도 데모 데이터로 화면을 확인할 수 있습니다. 실제 인증과 DB를 연결하려면 `.env.example`을 기준으로 `.env.local`을 설정하세요.

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ITAD_API_KEY=
AUTH_DEV_SKIP_EMAIL_CONFIRMATION=false
```

개발 중 Supabase 기본 이메일 발송 한도에 막히면 `.env.local`에서
`AUTH_DEV_SKIP_EMAIL_CONFIRMATION=true`로 설정할 수 있습니다. 이 옵션은
`localhost`에서만 service role로 확인 완료 계정을 만들고 즉시 로그인합니다.

## AI Insight Demo

가격 snapshot 기반 인사이트는 job route가 `ai_game_insights`에 저장한 데이터만 홈에 노출합니다.

```bash
curl -X POST http://localhost:3000/api/jobs/generate-ai-insights \
  -H "x-job-secret: $JOB_SECRET"
```

저장된 결과는 홈의 `이번 주 할인 인사이트` 섹션 또는 `GET /api/insights`에서 확인합니다.
근거 snapshot이 없거나 7일보다 오래되면 현재가처럼 보이지 않도록 오래된 근거로 표시됩니다.

## Docs

- [Product Spec](docs/product-spec.md)
- [DB Schema](docs/db-schema.md)
- [API Flow](docs/api-flow.md)
- [Implementation Roadmap](docs/implementation-roadmap.md)
- [Demo Guide](docs/demo-guide.md)
- [Load Testing](docs/load-testing.md)
- [Bundle Analysis](docs/bundle-analysis.md)

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run e2e
npm run e2e:smoke
npm run analyze
```

## 아키텍처

- `src/app`: Next.js App Router pages, server actions, public API routes.
- `src/components`: reusable UI and client interaction components.
- `src/lib`: Supabase, cache, rate limit, search/deal/release feed, analytics, monitoring, AI insight logic.
- `supabase`: database migrations and schema-facing setup.
- `tests`: Vitest unit/API tests and Playwright E2E tests.

Public route는 process-local cache와 rate limit bucket을 사용한다. 포트폴리오 배포에는 충분하지만, multi-instance 운영 traffic은 shared cache/rate-limit state를 Redis 또는 Vercel KV로 옮겨야 한다.

## 테스트와 CI

GitHub Actions는 아래 검증을 실행한다.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e:smoke
```

`npm run e2e:smoke`는 `@smoke` tag가 있는 Playwright test만 실행한다. 비용이 큰 full E2E suite와 public-route smoke를 분리한다. Full E2E는 아래 명령으로 실행한다.

```bash
npm run e2e
```

CI가 실패하면 아래 log를 순서대로 확인한다.

- `Typecheck`: TypeScript error와 route type issue.
- `Lint`: ESLint/Next.js rule failure.
- `Unit tests`: Vitest assertion output.
- `Production build`: Next.js build, route generation, env validation error.
- `E2E smoke`: Playwright trace, screenshot, HTML report artifact.

## 배포

Vercel 배포는 같은 build command를 사용한다.

```bash
npm run build
```

Vercel에는 아래 environment variable 이름만 설정한다. 실제 값은 commit하지 않는다.

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ITAD_API_KEY
ITAD_ENABLE_LOCAL_DEV
AUTH_DEV_SKIP_EMAIL_CONFIRMATION
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_POSTHOG_TOKEN
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_SENTRY_DSN
SENTRY_DSN
JOB_SECRET
PUBLIC_API_RATE_LIMIT_ENABLED
PUBLIC_API_RATE_LIMIT_MAX_REQUESTS
PUBLIC_API_RATE_LIMIT_WINDOW_SECONDS
```

배포 후 아래 항목을 확인한다.

- Home route가 열리고 popular game card가 보인다.
- `/search?q=ring`, `/deals`, `/releases`, `/app`, `/login`, `/signup`가 load된다.
- `/api/public/popular`가 cache metadata가 포함된 JSON을 반환한다.
- [Demo Guide](docs/demo-guide.md)의 demo account 또는 demo procedure가 동작한다.
- `.env.local`과 secret 값이 GitHub에 포함되지 않는다.
