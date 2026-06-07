# Database Schema

Last updated: 2026-05-26

## 1. Design Principles

- 사용자의 관심 목록과 공개 게임 데이터를 분리한다.
- 같은 게임이 Steam과 Epic에 모두 있어도 내부 `games` row는 하나로 유지한다.
- 스토어별 상품, 가격 snapshot, 사용자 watchlist는 별도 테이블로 정규화한다.
- Supabase Row Level Security를 전제로 사용자 데이터는 `auth.uid()` 기준으로 보호한다.
- 외부 API 응답은 그대로 의존하지 않고, 필요한 필드만 정규화하고 원본 응답 일부는 `raw` JSONB로 보관한다.

## 2. Entity Overview

```txt
auth.users
  1:1 profiles
  1:N watchlist_items
  1:N experiment_exposures
  1:N analytics_events

games
  1:N game_store_products
  1:N watchlist_items
  1:N ai_game_insights

game_store_products
  1:N price_snapshots

experiments
  1:N experiment_exposures

ai_insight_runs
  1:N ai_game_insights
```

## 3. Types

```sql
create type store_code as enum ('steam', 'epic');
create type release_status as enum ('released', 'upcoming', 'unknown');
create type experiment_variant as enum ('control', 'variant_a', 'variant_b');
```

## 4. Tables

### profiles

User-facing profile data. Authentication source of truth remains `auth.users`.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_country char(2) not null default 'KR',
  preferred_currency text not null default 'KRW',
  webview_last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### games

Canonical game entity shared by all users.

```sql
create table public.games (
  id uuid primary key default gen_random_uuid(),
  itad_game_id text unique,
  slug text unique,
  title text not null,
  image_url text,
  release_date date,
  release_status release_status not null default 'unknown',
  steam_review_count integer,
  steam_positive_ratio numeric(5, 2),
  tags text[] not null default '{}',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### game_store_products

Store-specific purchasable products.

```sql
create table public.game_store_products (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  store store_code not null,
  external_id text not null,
  store_url text not null,
  title text not null,
  country char(2),
  is_active boolean not null default true,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store, external_id)
);
```

Steam product IDs should use stable forms such as `app/{id}` when available. Epic product IDs should preserve the source offer/catalog identifiers returned by the external data provider.

### watchlist_items

User-owned interest list.

```sql
create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  target_price_cents integer,
  target_discount_percent integer check (
    target_discount_percent is null
    or (target_discount_percent between 0 and 100)
  ),
  note text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);
```

### price_snapshots

Append-only price observations.

```sql
create table public.price_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.game_store_products(id) on delete cascade,
  country char(2) not null default 'KR',
  currency text not null,
  regular_price_cents integer,
  current_price_cents integer,
  discount_percent integer check (
    discount_percent is null
    or (discount_percent between 0 and 100)
  ),
  is_historical_low boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  observed_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb
);
```

### search_cache

External API cache for search and deals.

```sql
create table public.search_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  source text not null,
  params jsonb not null,
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

### popular_rankings

Materialized ranking data for public home.

```sql
create table public.popular_rankings (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  country char(2) not null default 'KR',
  rank_score numeric(12, 4) not null,
  review_score numeric(12, 4),
  discount_score numeric(12, 4),
  release_score numeric(12, 4),
  calculated_at timestamptz not null default now(),
  unique (game_id, country)
);
```

### experiments

Experiment definitions for A/B tests.

```sql
create table public.experiments (
  key text primary key,
  name text not null,
  hypothesis text not null,
  primary_metric text not null,
  guardrail_metrics text[] not null default '{}',
  is_active boolean not null default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
```

### experiment_exposures

Stores which variant each user or anonymous session saw.

```sql
create table public.experiment_exposures (
  id uuid primary key default gen_random_uuid(),
  experiment_key text not null references public.experiments(key),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  variant experiment_variant not null,
  exposed_at timestamptz not null default now(),
  unique (experiment_key, user_id),
  unique (experiment_key, anonymous_id)
);
```

### analytics_events

Product analytics events mirrored into our DB for portfolio analysis. PostHog remains the main analytics tool.

```sql
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  route text,
  device_class text,
  webview boolean not null default false,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
```

### ai_insight_runs

Tracks automated analysis jobs.

```sql
create table public.ai_insight_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  input_window_start timestamptz,
  input_window_end timestamptz,
  status text not null default 'queued',
  model_name text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
```

### ai_game_insights

AI-assisted or automated deal insights.

```sql
create table public.ai_game_insights (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ai_insight_runs(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  insight_type text not null,
  title text not null,
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric(5, 2),
  created_at timestamptz not null default now()
);
```

### api_request_logs

Minimal API observability for traffic and rate-limit analysis.

```sql
create table public.api_request_logs (
  id uuid primary key default gen_random_uuid(),
  route text not null,
  method text not null,
  status_code integer not null,
  duration_ms integer not null,
  cache_status text,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  created_at timestamptz not null default now()
);
```

## 5. RLS Policy Direction

Enable RLS on every table exposed to the browser.

```sql
alter table public.profiles enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.experiment_exposures enable row level security;
alter table public.analytics_events enable row level security;
```

Profile policies:

```sql
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
```

Watchlist policies:

```sql
create policy "Users can read own watchlist"
on public.watchlist_items
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert own watchlist"
on public.watchlist_items
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update own watchlist"
on public.watchlist_items
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete own watchlist"
on public.watchlist_items
for delete
to authenticated
using (user_id = auth.uid());
```

Public catalog tables such as `games`, `game_store_products`, `price_snapshots`, and `popular_rankings` can allow read access, but writes should go through server routes using controlled service logic.

## 6. Indexes

```sql
create index games_title_trgm_idx on public.games using gin (title gin_trgm_ops);
create index games_tags_idx on public.games using gin (tags);
create index products_game_store_idx on public.game_store_products (game_id, store);
create index price_snapshots_product_observed_idx on public.price_snapshots (product_id, observed_at desc);
create index watchlist_user_created_idx on public.watchlist_items (user_id, created_at desc);
create index search_cache_expiry_idx on public.search_cache (expires_at);
create index popular_rankings_country_score_idx on public.popular_rankings (country, rank_score desc);
create index analytics_events_name_time_idx on public.analytics_events (event_name, occurred_at desc);
create index api_request_logs_route_time_idx on public.api_request_logs (route, created_at desc);
```

`gin_trgm_ops` requires the `pg_trgm` extension:

```sql
create extension if not exists pg_trgm;
```

## 7. Data Retention

- `price_snapshots`: keep 180 days in MVP, archive later if needed.
- `api_request_logs`: keep 30 days.
- `analytics_events`: keep 90 days locally because PostHog is the long-term analytics system.
- `search_cache`: delete expired rows daily.
- `ai_game_insights`: keep all generated insights, but mark stale insights in product logic if source prices changed.

## 8. Migration Order

1. Enable extensions and custom types.
2. Create public catalog tables.
3. Create user-owned tables.
4. Create analytics, experiment, and AI tables.
5. Enable RLS and policies.
6. Add indexes.
7. Add seed experiments and sample public ranking job.

## 9. References

- Supabase Auth and RLS: https://supabase.com/docs/guides/auth/auth-deep-dive/auth-row-level-security
- Supabase Postgres RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL Row Security Policies: https://www.postgresql.org/docs/17/ddl-rowsecurity.html
- IsThereAnyDeal API: https://docs.isthereanydeal.com/
