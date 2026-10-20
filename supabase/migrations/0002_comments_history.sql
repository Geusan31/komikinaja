-- ============================================================
-- KomikinAja — Migrasi M3 (komentar & riwayat baca)
-- Jalankan setelah 0001_init.sql.
--
-- Isi: tabel comments (per komik) & reading_history, beserta RLS.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabel comments — komentar per komik (id Kitsu, string).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 2. Tabel reading_history — riwayat komik yang dibuka pengguna.
-- Disimpan denormalisasi (judul & sampul) seperti favorites.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------
alter table public.comments enable row level security;
alter table public.reading_history enable row level security;

-- Komentar: siapa pun bisa membaca; hanya penulis yang bisa menambah/mengubah/menghapus miliknya.
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

-- Riwayat baca: hanya pemilik yang bisa melihat/menambah/mengubah/menghapus.
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

-- ------------------------------------------------------------
-- 4. updated_at comments (memakai fungsi set_updated_at dari 0001)
-- ------------------------------------------------------------
drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();
