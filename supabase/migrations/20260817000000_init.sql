-- HoopFinder initial schema.
-- Courts are seeded by hand (see supabase/seed.sql); there is no admin UI.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.court_kind as enum ('outdoor', 'indoor');
create type public.run_type as enum ('shooting', 'small', 'full');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.courts (
  id          text primary key,               -- short slug, e.g. 'woodlawn'
  name        text not null,
  area        text not null,
  kind        public.court_kind not null,
  full_courts integer not null check (full_courts >= 0),
  lights      boolean not null default false,
  nets        text not null,
  surface     text not null,
  cost        text not null,
  hours       text not null,
  parking     text not null,
  lat         double precision not null,
  lng         double precision not null,
  created_at  timestamptz not null default now()
);

create table public.checkins (
  id         uuid primary key default gen_random_uuid(),
  court_id   text not null references public.courts (id) on delete cascade,
  device_id  text not null,
  run_type   public.run_type not null,
  -- 12 represents "12+"; the UI only offers 2/4/6/8/10/12.
  headcount  integer not null check (headcount between 1 and 12),
  created_at timestamptz not null default now()
);

-- Every read is "latest check-ins for one court", so index that directly.
create index checkins_court_id_created_at_idx
  on public.checkins (court_id, created_at desc);

create table public.court_ratings (
  id         uuid primary key default gen_random_uuid(),
  court_id   text not null references public.courts (id) on delete cascade,
  device_id  text not null,
  stars      integer not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  unique (court_id, device_id)
);

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Public read on all three tables, public insert on checkins and court_ratings.
-- There are deliberately no update or delete policies: with RLS enabled and no
-- matching policy, those statements affect zero rows. The explicit revokes
-- below make that intent obvious to anyone reading the schema.
-- ---------------------------------------------------------------------------

alter table public.courts enable row level security;
alter table public.checkins enable row level security;
alter table public.court_ratings enable row level security;

create policy "courts are publicly readable"
  on public.courts for select to anon, authenticated using (true);

create policy "checkins are publicly readable"
  on public.checkins for select to anon, authenticated using (true);

create policy "court ratings are publicly readable"
  on public.court_ratings for select to anon, authenticated using (true);

create policy "anyone can check in"
  on public.checkins for insert to anon, authenticated with check (true);

create policy "anyone can rate a court"
  on public.court_ratings for insert to anon, authenticated with check (true);

revoke insert, update, delete on public.courts from anon, authenticated;
revoke update, delete on public.checkins from anon, authenticated;
revoke update, delete on public.court_ratings from anon, authenticated;
