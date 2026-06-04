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

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run e2e
npm run analyze
```
