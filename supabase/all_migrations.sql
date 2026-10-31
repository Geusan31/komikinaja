-- ============================================================================
-- KomikinAja — SEMUA MIGRASI (0001 s.d. 0005) GABUNGAN
-- Jalankan file ini sekaligus di Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

-- ============================================================
-- BAGIAN 1: 0001_init.sql (Akun Pengguna, Profil, Favorit, RLS)
-- ============================================================

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text,
  avatar_url text,
  role       text check (role in ('reader', 'author')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil publik tiap pengguna, terhubung ke auth.users.';

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  comic_id    text not null,
  comic_title text not null,
  comic_cover text,
  created_at  timestamptz not null default now(),
  unique (user_id, comic_id)
);

comment on table public.favorites is 'Daftar komik favorit per pengguna (metadata Kitsu).';

create index if not exists favorites_user_id_idx on public.favorites (user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ============================================================
-- BAGIAN 2: 0002_comments_history.sql (Komentar & Riwayat Baca)
-- ============================================================

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  comic_id   text not null,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.comments is 'Komentar pembaca per komik (metadata Kitsu).';

create index if not exists comments_comic_id_idx on public.comments (comic_id);

create table if not exists public.reading_history (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  comic_id       text not null,
  comic_title    text not null,
  comic_cover    text,
  last_viewed_at timestamptz not null default now(),
  unique (user_id, comic_id)
);

comment on table public.reading_history is 'Riwayat komik terakhir dibuka per pengguna.';

create index if not exists reading_history_user_id_idx on public.reading_history (user_id);

alter table public.comments enable row level security;
alter table public.reading_history enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

drop policy if exists "Users can insert own comments" on public.comments;
create policy "Users can insert own comments"
  on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own comments" on public.comments;
create policy "Users can update own comments"
  on public.comments for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own reading history" on public.reading_history;
create policy "Users can view own reading history"
  on public.reading_history for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own reading history" on public.reading_history;
create policy "Users can insert own reading history"
  on public.reading_history for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own reading history" on public.reading_history;
create policy "Users can update own reading history"
  on public.reading_history for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reading history" on public.reading_history;
create policy "Users can delete own reading history"
  on public.reading_history for delete using (auth.uid() = user_id);

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();


-- ============================================================
-- BAGIAN 3: 0003_creator_comics.sql (Komik Kreator, Chapter & Storage)
-- ============================================================

create table if not exists public.comics (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  description text,
  cover_url   text,
  genres      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.comics is 'Karya komik yang diterbitkan author (bukan katalog Kitsu).';

create index if not exists comics_author_id_idx on public.comics (author_id);

create table if not exists public.chapters (
  id         uuid primary key default gen_random_uuid(),
  comic_id   uuid not null references public.comics (id) on delete cascade,
  number     numeric not null,
  title      text,
  created_at timestamptz not null default now(),
  unique (comic_id, number)
);

comment on table public.chapters is 'Chapter dalam komik karya author.';

create index if not exists chapters_comic_id_idx on public.chapters (comic_id);

create table if not exists public.chapter_pages (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references public.chapters (id) on delete cascade,
  page_number int not null,
  image_path  text not null,
  created_at  timestamptz not null default now(),
  unique (chapter_id, page_number)
);

comment on table public.chapter_pages is 'Halaman gambar per chapter (path di Storage).';

create index if not exists chapter_pages_chapter_id_idx on public.chapter_pages (chapter_id);

drop trigger if exists comics_set_updated_at on public.comics;
create trigger comics_set_updated_at
  before update on public.comics
  for each row execute function public.set_updated_at();

alter table public.comics enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_pages enable row level security;

drop policy if exists "Comics are viewable by everyone" on public.comics;
create policy "Comics are viewable by everyone"
  on public.comics for select using (true);

drop policy if exists "Authors insert own comics" on public.comics;
create policy "Authors insert own comics"
  on public.comics for insert with check (auth.uid() = author_id);

drop policy if exists "Authors update own comics" on public.comics;
create policy "Authors update own comics"
  on public.comics for update
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "Authors delete own comics" on public.comics;
create policy "Authors delete own comics"
  on public.comics for delete using (auth.uid() = author_id);

drop policy if exists "Chapters are viewable by everyone" on public.chapters;
create policy "Chapters are viewable by everyone"
  on public.chapters for select using (true);

drop policy if exists "Authors insert own chapters" on public.chapters;
create policy "Authors insert own chapters"
  on public.chapters for insert
  with check (exists (
    select 1 from public.comics c where c.id = comic_id and c.author_id = auth.uid()
  ));

drop policy if exists "Authors update own chapters" on public.chapters;
create policy "Authors update own chapters"
  on public.chapters for update
  using (exists (
    select 1 from public.comics c where c.id = comic_id and c.author_id = auth.uid()
  ));

drop policy if exists "Authors delete own chapters" on public.chapters;
create policy "Authors delete own chapters"
  on public.chapters for delete
  using (exists (
    select 1 from public.comics c where c.id = comic_id and c.author_id = auth.uid()
  ));

drop policy if exists "Pages are viewable by everyone" on public.chapter_pages;
create policy "Pages are viewable by everyone"
  on public.chapter_pages for select using (true);

drop policy if exists "Authors insert own pages" on public.chapter_pages;
create policy "Authors insert own pages"
  on public.chapter_pages for insert
  with check (exists (
    select 1 from public.chapters ch
    join public.comics c on c.id = ch.comic_id
    where ch.id = chapter_id and c.author_id = auth.uid()
  ));

drop policy if exists "Authors delete own pages" on public.chapter_pages;
create policy "Authors delete own pages"
  on public.chapter_pages for delete
  using (exists (
    select 1 from public.chapters ch
    join public.comics c on c.id = ch.comic_id
    where ch.id = chapter_id and c.author_id = auth.uid()
  ));

-- Storage Bucket untuk media
insert into storage.buckets (id, name, public)
values ('komikinaja-media', 'komikinaja-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read komikinaja media" on storage.objects;
create policy "Public read komikinaja media"
  on storage.objects for select
  using (bucket_id = 'komikinaja-media');

drop policy if exists "Users upload own media" on storage.objects;
create policy "Users upload own media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'komikinaja-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own media" on storage.objects;
create policy "Users delete own media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'komikinaja-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- BAGIAN 4: 0004_analytics_moderation.sql (Moderasi & Analitik)
-- ============================================================

alter table public.profiles
  add column if not exists is_admin  boolean not null default false,
  add column if not exists banned_at timestamptz;

comment on column public.profiles.is_admin  is 'Penanda admin internal (di-bootstrap manual via SQL).';
comment on column public.profiles.banned_at is 'Waktu akun diblokir; NULL berarti aktif.';

alter table public.comics
  add column if not exists hidden boolean not null default false;

comment on column public.comics.hidden is 'True bila komik disembunyikan admin (moderasi).';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create table if not exists public.followers (
  id          uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (follower_id, author_id)
);

comment on table public.followers is 'Relasi ikut-mengikuti: follower_id mengikuti author_id.';

create index if not exists followers_author_id_idx  on public.followers (author_id);
create index if not exists followers_follower_id_idx on public.followers (follower_id);

alter table public.followers enable row level security;

drop policy if exists "Follower counts are viewable by everyone" on public.followers;
create policy "Follower counts are viewable by everyone"
  on public.followers for select using (true);

drop policy if exists "Users can follow authors" on public.followers;
create policy "Users can follow authors"
  on public.followers for insert with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow authors" on public.followers;
create policy "Users can unfollow authors"
  on public.followers for delete using (auth.uid() = follower_id);

create table if not exists public.chapter_views (
  id         uuid primary key default gen_random_uuid(),
  comic_id   uuid not null references public.comics (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete set null,
  viewed_at  timestamptz not null default now()
);

comment on table public.chapter_views is 'Saat chapter karya creator dibuka (untuk analitik author).';

create index if not exists chapter_views_comic_id_idx   on public.chapter_views (comic_id);
create index if not exists chapter_views_chapter_id_idx on public.chapter_views (chapter_id);

alter table public.chapter_views enable row level security;

drop policy if exists "Anyone can record chapter views" on public.chapter_views;
create policy "Anyone can record chapter views"
  on public.chapter_views for insert
  with check (
    (auth.uid() is null and user_id is null)
    or auth.uid() = user_id
  );

drop policy if exists "Authors can read views of own comics" on public.chapter_views;
create policy "Authors can read views of own comics"
  on public.chapter_views for select
  using (
    exists (
      select 1 from public.comics c
      where c.id = comic_id and c.author_id = auth.uid()
    )
    or public.is_admin()
  );

-- Update kebijakan komik agar support moderasi
drop policy if exists "Comics are viewable by everyone" on public.comics;
create policy "Comics are viewable by everyone"
  on public.comics for select
  using (hidden = false or auth.uid() = author_id or public.is_admin());

drop policy if exists "Authors update own comics" on public.comics;
create policy "Authors update own comics"
  on public.comics for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

drop policy if exists "Chapters are viewable by everyone" on public.chapters;
create policy "Chapters are viewable by everyone"
  on public.chapters for select
  using (
    exists (
      select 1 from public.comics c
      where c.id = comic_id
        and (c.hidden = false or c.author_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Pages are viewable by everyone" on public.chapter_pages;
create policy "Pages are viewable by everyone"
  on public.chapter_pages for select
  using (
    exists (
      select 1
      from public.chapters ch
      join public.comics c on c.id = ch.comic_id
      where ch.id = chapter_id
        and (c.hidden = false or c.author_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create or replace function public.guard_profiles_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.is_admin is distinct from old.is_admin
      or new.banned_at is distinct from old.banned_at)
     and auth.uid() is not null
     and not exists (
       select 1 from public.profiles p
       where p.id = auth.uid() and p.is_admin = true
     )
  then
    raise exception 'Hanya admin yang boleh mengubah status admin/ban.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profiles_admin on public.profiles;
create trigger guard_profiles_admin
  before update on public.profiles
  for each row execute function public.guard_profiles_admin();


-- ============================================================
-- BAGIAN 5: 0005_community_and_monetization.sql (Komunitas & Dompet Demo)
-- ============================================================

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

alter table public.chapters
  add column if not exists is_premium boolean not null default false,
  add column if not exists price_coins integer not null default 0;

comment on column public.chapters.is_premium is 'True jika chapter berbayar koin.';
comment on column public.chapters.price_coins is 'Harga dalam satuan koin.';

create table if not exists public.communities (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('creator', 'comic')),
  target_id   text not null,
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
