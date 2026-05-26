create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create type public.store_code as enum ('steam', 'epic');
create type public.release_status as enum ('released', 'upcoming', 'unknown');
create type public.experiment_variant as enum ('control', 'variant_a', 'variant_b');

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

create table public.games (
  id uuid primary key default gen_random_uuid(),
  itad_game_id text unique,
  slug text unique,
  title text not null,
  image_url text,
  release_date date,
  release_status public.release_status not null default 'unknown',
  steam_review_count integer,
  steam_positive_ratio numeric(5, 2),
  tags text[] not null default '{}',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_store_products (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  store public.store_code not null,
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

create table public.search_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  source text not null,
  params jsonb not null,
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

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

create table public.experiment_exposures (
  id uuid primary key default gen_random_uuid(),
  experiment_key text not null references public.experiments(key),
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  variant public.experiment_variant not null,
  exposed_at timestamptz not null default now(),
  unique (experiment_key, user_id),
  unique (experiment_key, anonymous_id)
);

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

alter table public.profiles enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.experiment_exposures enable row level security;
alter table public.analytics_events enable row level security;

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

create index games_title_trgm_idx on public.games using gin (title gin_trgm_ops);
create index games_tags_idx on public.games using gin (tags);
create index products_game_store_idx on public.game_store_products (game_id, store);
create index price_snapshots_product_observed_idx on public.price_snapshots (product_id, observed_at desc);
create index watchlist_user_created_idx on public.watchlist_items (user_id, created_at desc);
create index search_cache_expiry_idx on public.search_cache (expires_at);
create index popular_rankings_country_score_idx on public.popular_rankings (country, rank_score desc);
create index analytics_events_name_time_idx on public.analytics_events (event_name, occurred_at desc);
create index api_request_logs_route_time_idx on public.api_request_logs (route, created_at desc);
