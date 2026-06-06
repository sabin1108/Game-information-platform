# 번들 분석 및 Vite 플레이그라운드 보고서

마지막 갱신: 2026-06-06

## Next 번들 분석

실행 명령:

```sh
npm run analyze
```

`npm run analyze`는 `scripts/run-next-analyze.mjs`를 통해 `ANALYZE=true`를 설정한다. 그래서
PowerShell, cmd, bash, CI shell에서 같은 방식으로 실행된다. Next 번들 분석기는 production
build 중 `.next/analyze/` 아래에 HTML 보고서를 만든다.

실행 기록:

```txt
날짜: 2026-06-06
명령: npm run analyze
상태: 통과
보고서 위치:
- .next/analyze/client.html
- .next/analyze/nodejs.html
- .next/analyze/edge.html
빌드 요약:
- 홈 route: route size 1.9 kB, first load JS 108 kB
- 할인 route: route size 2.32 kB, first load JS 108 kB
- 검색 route: route size 471 B, first load JS 107 kB
- 공통 first load JS: 102 kB
```

개선 후보:

- `AiInsightSection`은 첫 공개 feed 콘텐츠 뒤에서만 필요하다. 분석기에서 초기 app chunk에
  의미 있는 크기로 포함된 것이 확인되면 dynamic import로 분리하거나 feed shell 아래에서 stream
  처리하는 후보로 둔다.

## Vite 플레이그라운드

실행 명령:

```sh
npm run build:game-card-lab
```

플레이그라운드는 `packages/game-card-lab`에 있다. 이 패키지는
`src/components/game-card.tsx`가 쓰는 공개 game card 데이터 계약과 맞춘 작은 Vite library
build다. 포함 데이터는 title, review summary, tags, store prices다. 메인 Next app에 별도
component runtime을 묶지 않고 Vite 산출물을 만들기 위한 증거로 사용한다.

예상 산출물:

```txt
packages/game-card-lab/dist/game-card-lab.js
packages/game-card-lab/dist/game-card-lab.css
```

2026-06-06 로컬 실행 결과:

```txt
game-card-lab.js   1.35 kB, gzip 0.66 kB
game-card-lab.css  1.06 kB, gzip 0.50 kB
```

이력서 문장 후보:

- Next bundle analyzer와 Vite 기반 game-card lab build를 실행해 app bundle 구조와 독립 컴포넌트
  산출물을 비교하고 최적화 후보를 문서화했다.
