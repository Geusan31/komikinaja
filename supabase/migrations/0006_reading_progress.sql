-- ============================================================
-- KomikinAja — Migrasi UX Redesign (progres baca tingkat chapter)
-- Jalankan setelah 0005_community_and_monetization.sql.
--
-- Isi:
-- 1. Tambah kolom last_chapter_number, last_chapter_id, last_chapter_title
--    pada tabel reading_history untuk Dynamic Hero Banner "Lanjutkan Chapter X".
-- 2. Tabel read_chapters + RLS untuk menandai chapter yang sudah dibaca.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Perluas reading_history dengan progres chapter terakhir
-- ------------------------------------------------------------
alter table public.reading_history
  add column if not exists last_chapter_number integer,
  add column if not exists last_chapter_id text,
  add column if not exists last_chapter_title text;

-- ------------------------------------------------------------
-- 2. Tabel read_chapters — daftar chapter yang pernah dibaca pengguna
-- ------------------------------------------------------------
create table if not exists public.read_chapters (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  comic_id       text not null,
  chapter_id     text not null,
  chapter_number integer not null,
  read_at        timestamptz not null default now(),
  unique (user_id, comic_id, chapter_id)
);

comment on table public.read_chapters is 'Daftar chapter yang sudah dibaca per pengguna.';

create index if not exists read_chapters_user_comic_idx
  on public.read_chapters (user_id, comic_id);

-- ------------------------------------------------------------
-- 3. Hak akses & RLS untuk read_chapters
-- ------------------------------------------------------------
revoke all on public.read_chapters from anon;
grant select, insert, update, delete on public.read_chapters to authenticated;

alter table public.read_chapters enable row level security;

drop policy if exists "Users can view own read chapters" on public.read_chapters;
create policy "Users can view own read chapters"
  on public.read_chapters for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own read chapters" on public.read_chapters;
create policy "Users can insert own read chapters"
  on public.read_chapters for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own read chapters" on public.read_chapters;
create policy "Users can update own read chapters"
  on public.read_chapters for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own read chapters" on public.read_chapters;
create policy "Users can delete own read chapters"
  on public.read_chapters for delete
  to authenticated
  using ((select auth.uid()) = user_id);

