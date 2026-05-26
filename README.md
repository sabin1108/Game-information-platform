# Game Deal Watch

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

개발 서버 기본 주소는 `http://localhost:3100`입니다. Supabase 없이도 데모 데이터로 화면을 확인할 수 있습니다. 실제 인증과 DB를 연결하려면 `.env.example`을 기준으로 `.env.local`을 설정하세요.

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ITAD_API_KEY=
```

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
