# Experiments

## `popular-card-density`

Goal: measure whether denser popular-game cards increase store intent without hurting watchlist conversion.

Variants:

- `control`: current three-column desktop popular card layout.
- `variant_a`: denser four-column desktop popular card layout with reduced card spacing.

Assignment:

- Authenticated users are assigned by stable Supabase user id.
- Anonymous users are assigned by the `gdw_anonymous_id` cookie.
- The assignment hash is deterministic, so the same user or anonymous session keeps the same variant.

Exposure event:

- Event: `experiment_exposure`
- Properties: `experiment_key`, `variant`, `subject_type`, `primary_metric`, `guardrail_metric`

Primary metric:

- `deal_click`: user clicks a store price row or primary store-open button.

Guardrail metric:

- `watchlist_add`: user adds a game to the watchlist. This should not decrease while optimizing for deal clicks.

Operational rule:

- PostHog capture only runs when `NEXT_PUBLIC_POSTHOG_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` are configured.
- Without PostHog settings, analytics calls become no-ops and must not block search, deals, store clicks, login, or watchlist flows.
