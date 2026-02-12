-- 2026-02-11_event_level_freshness.sql
-- Doel: event-level versheid opslaan per broker (cross-user zichtbaar).

create table if not exists public.odds_line_freshness (
  broker_id text not null,
  external_event_id text not null,
  last_seen_at timestamptz not null default now(),
  scan_run_id text null,
  source_user_id uuid null,
  updated_at timestamptz not null default now(),
  constraint odds_line_freshness_pkey primary key (broker_id, external_event_id)
);

-- Migratiepad als oude versie (met user_id in PK) al bestaat.
do $$
declare
  has_user_id boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'odds_line_freshness'
      and column_name = 'user_id'
  ) into has_user_id;

  if has_user_id then
    -- Zorg dat oude user herleidbaar blijft.
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'odds_line_freshness'
        and column_name = 'source_user_id'
    ) then
      alter table public.odds_line_freshness add column source_user_id uuid null;
    end if;

    execute 'update public.odds_line_freshness set source_user_id = user_id where source_user_id is null';

    -- Dubbele broker+event rows dedupliceren op meest recente check.
    with ranked as (
      select ctid,
             row_number() over (
               partition by broker_id, external_event_id
               order by last_seen_at desc, updated_at desc
             ) as rn
      from public.odds_line_freshness
    )
    delete from public.odds_line_freshness t
    using ranked r
    where t.ctid = r.ctid
      and r.rn > 1;

    alter table public.odds_line_freshness
      drop constraint if exists odds_line_freshness_pkey;

    alter table public.odds_line_freshness
      add constraint odds_line_freshness_pkey primary key (broker_id, external_event_id);

    alter table public.odds_line_freshness
      drop column if exists user_id;
  end if;
end
$$;

create index if not exists idx_odds_line_freshness_seen
  on public.odds_line_freshness (last_seen_at desc);

create index if not exists idx_odds_line_freshness_broker_event
  on public.odds_line_freshness (broker_id, external_event_id);

-- RLS (cross-user read/write voor authenticated)
alter table public.odds_line_freshness enable row level security;

-- Oude user-specifieke policies opruimen indien aanwezig.
drop policy if exists olf_select_own on public.odds_line_freshness;
drop policy if exists olf_insert_own on public.odds_line_freshness;
drop policy if exists olf_update_own on public.odds_line_freshness;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'odds_line_freshness'
      and policyname = 'olf_select_authenticated'
  ) then
    create policy olf_select_authenticated
      on public.odds_line_freshness
      for select
      using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'odds_line_freshness'
      and policyname = 'olf_insert_authenticated'
  ) then
    create policy olf_insert_authenticated
      on public.odds_line_freshness
      for insert
      with check (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'odds_line_freshness'
      and policyname = 'olf_update_authenticated'
  ) then
    create policy olf_update_authenticated
      on public.odds_line_freshness
      for update
      using (auth.role() = 'authenticated')
      with check (auth.role() = 'authenticated');
  end if;
end
$$;
