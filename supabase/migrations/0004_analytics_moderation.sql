-- ============================================================
-- KomikinAja — Migrasi M4b (analitik author + moderasi admin)
-- Jalankan setelah 0003_creator_comics.sql.
--
-- Isi:
--   1. Kolom profil: is_admin, banned_at  (moderasi S1)
--   2. Kolom comics: hidden               (moderasi konten S1)
--   3. Fungsi is_admin()
--   4. Tabel followers      (analitik A2 — jumlah follower)
--   5. Tabel chapter_views  (analitik A2 — pembaca & chapter populer)
--   6. Kebijakan moderasi: komik tersembunyi hanya tampil untuk
--      author/admin; admin boleh update profil (ban) & komik (hide)
--   7. Trigger guard: user biasa TIDAK boleh mengubah is_admin/banned_at
-- ============================================================

-- ------------------------------------------------------------
-- 1. Kolom profil baru
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin  boolean not null default false,
  add column if not exists banned_at timestamptz;

comment on column public.profiles.is_admin  is 'Penanda admin internal (di-bootstrap manual via SQL).';
comment on column public.profiles.banned_at is 'Waktu akun diblokir; NULL berarti aktif.';

-- ------------------------------------------------------------
-- 2. Kolom comics baru: hidden (moderasi konten)
-- ------------------------------------------------------------
alter table public.comics
  add column if not exists hidden boolean not null default false;

comment on column public.comics.hidden is 'True bila komik disembunyikan admin (moderasi).';

-- ------------------------------------------------------------
-- 3. Fungsi bantu is_admin()
-- security definer agar membaca profiles tanpa terhambat RLS.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 4. Tabel followers — pembaca mengikuti author (A2)
-- ------------------------------------------------------------
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

-- Hitung follower boleh publik (angka publik), tapi tulis/hapus hanya pemilik.
drop policy if exists "Follower counts are viewable by everyone" on public.followers;
create policy "Follower counts are viewable by everyone"
  on public.followers for select using (true);

drop policy if exists "Users can follow authors" on public.followers;
create policy "Users can follow authors"
  on public.followers for insert with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow authors" on public.followers;
create policy "Users can unfollow authors"
  on public.followers for delete using (auth.uid() = follower_id);

-- ------------------------------------------------------------
-- 5. Tabel chapter_views — setiap kali sebuah chapter karya
--    creator dibuka (A2). user_id NULL untuk pembaca anon.
-- ------------------------------------------------------------
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

-- Siapa pun boleh menulis (login -> user_id = auth.uid(); anon -> user_id NULL).
drop policy if exists "Anyone can record chapter views" on public.chapter_views;
create policy "Anyone can record chapter views"
  on public.chapter_views for insert
  with check (
    (auth.uid() is null and user_id is null)
    or auth.uid() = user_id
  );

-- Membaca: hanya author komik terkait, atau admin.
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

-- ------------------------------------------------------------
-- 6a. Moderasi: komik tersembunyi hanya tampil untuk
--     author komik / admin (seleksi publik menyaring hidden).
-- ------------------------------------------------------------
drop policy if exists "Comics are viewable by everyone" on public.comics;
create policy "Comics are viewable by everyone"
  on public.comics for select
  using (hidden = false or auth.uid() = author_id or public.is_admin());

-- Admin boleh mengubah komik siapa pun (untuk hide/unhide).
drop policy if exists "Authors update own comics" on public.comics;
create policy "Authors update own comics"
  on public.comics for update
  using (auth.uid() = author_id or public.is_admin())
  with check (auth.uid() = author_id or public.is_admin());

-- Chapter: hanya tampil bila komik induknya tampil.
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

-- Halaman chapter: hanya tampil bila komik induknya tampil.
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

-- Admin boleh mengubah profil siapa pun (untuk ban/unban).
-- Baris yang boleh diubah oleh admin adalah baris milik ORANG LAIN
-- (admin tidak perlu mengubah profil sendiri lewat kebijakan ini).
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ------------------------------------------------------------
-- 7. Trigger guard: cegah user biasa menaikkan is_admin /
--    mengubah banned_at miliknya sendiri (privilege escalation).
--    Dilewati bila auth.uid() NULL (SQL editor / service role).
-- ------------------------------------------------------------
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
