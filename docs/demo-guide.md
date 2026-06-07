# 포트폴리오 데모 가이드

이 문서는 배포 URL에서 프로젝트를 빠르게 확인하기 위한 공개 절차다. 실제 비밀번호, API key, service role key는 저장소와 이 문서에 넣지 않는다.

## 데모 계정 준비

1. Supabase dashboard에서 데모용 사용자를 만든다.
2. Email confirmed 상태로 설정한다.
3. 데모 비밀번호는 비밀 공유 채널로만 전달한다.
4. 데모가 끝나면 비밀번호를 교체하거나 계정을 비활성화한다.

문서와 이슈에는 계정 예시만 남긴다.

```txt
email: demo@example.com
password: 별도 전달
```

## 데모 동선

1. 배포 URL 접속 후 홈에서 인기 게임 카드와 스토어 링크를 확인한다.
2. `/deals`에서 Steam, 최소 할인율, 최대 가격 필터를 적용한다.
3. 데모 계정으로 로그인한다.
4. 할인 게임을 관심 목록에 추가한다.
5. `/app`에서 관심 목록, 목표 가격, 목표 할인율 상태를 확인한다.
6. `/search?q=ring`에서 검색 결과와 최근 검색 동선을 확인한다.
7. 모바일 또는 `?webview=1` 경로에서 하단 탭과 store bridge fallback을 확인한다.
8. AI evidence는 홈의 인사이트 섹션 또는 `GET /api/insights` 응답으로 확인한다.

## 샘플 관심 목록

| Game | Target price | Target discount | 확인 포인트 |
| --- | ---: | ---: | --- |
| Hades II | 22,000 KRW | 35% | 할인 카드, 리뷰 근거 |
| Cyberpunk 2077 | 35,000 KRW | 50% | 큰 할인율, Steam 링크 |
| Slay the Spire | 8,000 KRW | 70% | 낮은 목표 가격 |
| Baldur's Gate 3 | 45,000 KRW | 25% | 높은 관심도 게임 |

## 샘플 price snapshot / AI insight

운영 DB에 seed가 필요하면 Supabase dashboard에서 공개 가능한 샘플만 입력한다. `SUPABASE_SERVICE_ROLE_KEY`, `JOB_SECRET`, `ITAD_API_KEY` 값은 절대 문서화하지 않는다.

추천 샘플:

- `game_store_products`: 게임 title, store, public store URL
- `price_snapshots`: `country=KR`, `currency=KRW`, regular/current price, discount percent, observed time
- `ai_game_insights`: 할인 요약, confidence, evidence JSON

AI job route는 운영 secret이 있을 때만 사람이 실행한다.

```bash
curl -X POST https://<deployment-url>/api/jobs/generate-ai-insights \
  -H "x-job-secret: <JOB_SECRET>"
```

## 공개 가능 자료

- 데모 URL
- 데모 이메일 placeholder
- 시연 순서
- 목표 가격/할인율 예시
- 테스트 명령과 통과 결과
- analyzer report 위치

## 공개 금지 자료

- `.env.local`
- Supabase service role key
- ITAD API key
- PostHog/Sentry token 실제 값
- 실제 데모 계정 비밀번호
