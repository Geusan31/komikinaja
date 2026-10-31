-- ============================================================
-- KomikinAja — Migrasi M5 & M6 (Community System & Monetization Demo)
-- Sesuai PRD v2.2 (Read, Connect, Support)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Progres Baca (reading_progress)
-- ------------------------------------------------------------
create table if not exists public.reading_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  comic_id     text not null,
  chapter_id   text not null,
  page_number  int not null default 1,
  updated_at   timestamptz not null default now(),
  unique (user_id, comic_id)
);

comment on table public.reading_progress is 'Riwayat progres baca komik per pengguna.';
create index if not exists reading_progress_user_id_idx on public.reading_progress (user_id);

alter table public.reading_progress enable row level security;

drop policy if exists "Users can manage own reading progress" on public.reading_progress;
create policy "Users can manage own reading progress"
  on public.reading_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. Modifikasi Chapters: Tambah is_premium & price_coins
-- ------------------------------------------------------------
alter table public.chapters
  add column if not exists is_premium boolean not null default false,
  add column if not exists price_coins integer not null default 0;

comment on column public.chapters.is_premium is 'True jika chapter berbayar koin.';
comment on column public.chapters.price_coins is 'Harga dalam satuan koin.';

-- ------------------------------------------------------------
-- 3. Community System (Connect)
-- ------------------------------------------------------------
create table if not exists public.communities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('creator', 'comic')),
  target_id   text not null, -- author profile id (UUID) atau comic id (UUID / Kitsu ID)
  name        text not null,
  description text,
  rules       text,
  avatar_url  text,
  cover_url   text,
  creator_id  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (type, target_id)
);

comment on table public.communities is 'Komunitas resmi kreator dan komunitas diskusi komik.';

create table if not exists public.community_members (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  joined_at    timestamptz not null default now(),
  unique (community_id, user_id)
);

create table if not exists public.community_posts (
  id              uuid primary key default gen_random_uuid(),
  community_id    uuid not null references public.communities (id) on delete cascade,
  author_id       uuid not null references public.profiles (id) on delete cascade,
  title           text not null,
  content         text not null,
  is_author_badge boolean not null default false,
  is_spoiler      boolean not null default false,
  likes_count     integer not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.community_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.community_posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  content    text not null,
  is_spoiler boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_reports (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id   uuid not null,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,
  status      text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at  timestamptz not null default now()
);

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reports enable row level security;

-- Kebijakan Akses Komunitas
drop policy if exists "Communities are viewable by everyone" on public.communities;
create policy "Communities are viewable by everyone" on public.communities for select using (true);

drop policy if exists "Members viewable by everyone" on public.community_members;
create policy "Members viewable by everyone" on public.community_members for select using (true);

drop policy if exists "Users can join or leave community" on public.community_members;
create policy "Users can join or leave community" on public.community_members for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Posts viewable by everyone" on public.community_posts;
create policy "Posts viewable by everyone" on public.community_posts for select using (true);

drop policy if exists "Users can create posts" on public.community_posts;
create policy "Users can create posts" on public.community_posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "Comments viewable by everyone" on public.community_comments;
create policy "Comments viewable by everyone" on public.community_comments for select using (true);

drop policy if exists "Users can create comments" on public.community_comments;
create policy "Users can create comments" on public.community_comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can submit reports" on public.community_reports;
create policy "Users can submit reports" on public.community_reports for insert
  with check (auth.uid() = reporter_id);

-- ------------------------------------------------------------
-- 4. Monetization & Coin Wallet (Support)
-- ------------------------------------------------------------
create table if not exists public.wallets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  wallet_type   text not null default 'reader' check (wallet_type in ('reader', 'creator')),
  balance_coins integer not null default 0 check (balance_coins >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, wallet_type)
);

create table if not exists public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  transaction_type   text not null check (transaction_type in ('top_up', 'chapter_purchase', 'author_tip', 'work_support')),
  status             text not null default 'succeeded' check (status in ('pending', 'succeeded', 'failed', 'cancelled')),
  actor_user_id      uuid not null references public.profiles (id) on delete cascade,
  recipient_user_id  uuid references public.profiles (id) on delete set null,
  comic_id           text,
  chapter_id         text,
  coin_amount        integer not null check (coin_amount > 0),
  gross_amount_idr   integer default 0,
  is_demo            boolean not null default true,
  metadata           jsonb default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create table if not exists public.chapter_unlocks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  chapter_id     text not null,
  transaction_id uuid references public.transactions (id) on delete set null,
  unlocked_at    timestamptz not null default now(),
  unique (user_id, chapter_id)
);

create table if not exists public.creator_earnings (
  id                     uuid primary key default gen_random_uuid(),
  creator_id             uuid not null references public.profiles (id) on delete cascade,
  transaction_id         uuid not null references public.transactions (id) on delete cascade,
  gross_coins            integer not null,
  platform_fee_coins     integer not null default 0,
  creator_net_coins      integer not null,
  status                 text not null default 'available' check (status in ('pending', 'available', 'paid_out')),
  created_at             timestamptz not null default now()
);

create table if not exists public.support_messages (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  donor_user_id  uuid not null references public.profiles (id) on delete cascade,
  creator_id     uuid not null references public.profiles (id) on delete cascade,
  comic_id       text,
  coin_amount    integer not null,
  message        text,
  is_anonymous   boolean not null default false,
  created_at     timestamptz not null default now()
);

alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.chapter_unlocks enable row level security;
alter table public.creator_earnings enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "Users can view own wallets" on public.wallets;
create policy "Users can view own wallets" on public.wallets for select using (auth.uid() = user_id);

drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions" on public.transactions for select
  using (auth.uid() = actor_user_id or auth.uid() = recipient_user_id);

drop policy if exists "Users can view own chapter unlocks" on public.chapter_unlocks;
create policy "Users can view own chapter unlocks" on public.chapter_unlocks for select
  using (auth.uid() = user_id);

drop policy if exists "Creators can view own earnings" on public.creator_earnings;
create policy "Creators can view own earnings" on public.creator_earnings for select
  using (auth.uid() = creator_id);

drop policy if exists "Support messages are viewable by everyone" on public.support_messages;
create policy "Support messages are viewable by everyone" on public.support_messages for select using (true);
