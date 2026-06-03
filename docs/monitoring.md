# 모니터링 문서

## 설정

모니터링은 선택 사항이다. 모니터링 환경 변수가 없어도 앱은 정상 동작해야 한다.

환경 변수:

- `NEXT_PUBLIC_SENTRY_DSN`: 클라이언트 모니터링을 켠다. 클라이언트 이벤트는 `/api/monitoring/events`로 전달한다.
- `SENTRY_DSN`: 서버 모니터링을 켠다. 값이 없으면 서버는 `NEXT_PUBLIC_SENTRY_DSN`을 대신 사용한다.

DSN이 없으면 클라이언트와 서버 모니터링 호출은 네트워크 요청 없이 반환한다.

## 오류 보고

클라이언트 오류 수집 경로:

- `window.error`
- `unhandledrejection`
- App Router error boundary 오류

서버 오류는 모니터링이 적용된 API route에서 수집한다. API handler에서 처리되지 않은 예외가 발생하면 Sentry로 보고한 뒤 안전한 `500` 응답을 반환한다.

## Core Web Vitals

Core Web Vitals는 `next/web-vitals`에서 수집하며 다음 속성을 함께 기록한다.

- `route`: 현재 pathname
- `deviceClass`: `mobile`, `tablet`, `desktop`
- `name`, `value`, `rating`

device class 기준:

- `mobile`: viewport width가 `768px` 미만
- `tablet`: `768px` 이상, `1024px` 미만
- `desktop`: `1024px` 이상

## API 요청 관측

모니터링이 적용된 API route는 다음 응답 header를 추가한다.

- `X-API-Status`: 응답 status code
- `X-API-Duration-Ms`: handler 실행 시간, 밀리초 단위
- `X-API-Cache`: route별 cache header에서 읽은 cache 상태. 없으면 `none`

동일한 값은 `api_request` structured server log로도 기록한다.

## 성능 기준

초기 운영 기준:

- 주요 route의 LCP, CLS, INP, FCP, TTFB는 Core Web Vitals `good` 등급을 목표로 한다.
- 공개 feed API route는 일반적으로 `1500ms` 안에 응답해야 한다.
- 인증 dashboard API와 server action은 일반적으로 `2000ms` 안에 완료되어야 한다.
- cache 가능한 feed route는 cache status header를 노출해야 한다. 느린 응답을 hit/miss 기준으로 나눠 보기 위해서다.

지표가 반복해서 기준을 넘으면 affected route, device class, cache status, 샘플 timestamp를 포함해 후속 이슈를 만든다.
