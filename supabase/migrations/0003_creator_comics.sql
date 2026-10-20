-- ============================================================
-- KomikinAja — Migrasi M4 (ekosistem author)
-- Jalankan setelah 0002_comments_history.sql.
--
-- Isi: tabel komik karya author (comics, chapters, chapter_pages),
-- bucket Storage untuk sampul & halaman, beserta RLS.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabel comics — karya yang diterbitkan author.
--    id memakai UUID sehingga tidak tabrakan dengan id Kitsu (numerik).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 2. Tabel chapters — daftar chapter per komik karya author.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 3. Tabel chapter_pages — halaman (gambar) per chapter.
--    image_path adalah path di bucket Storage (dibuat public URL saat baca).
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 4. updated_at untuk comics (memakai set_updated_at dari 0001)
-- ------------------------------------------------------------
drop trigger if exists comics_set_updated_at on public.comics;
create trigger comics_set_updated_at
  before update on public.comics
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------
alter table public.comics enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_pages enable row level security;

-- Comics: publik bisa membaca; hanya author yang boleh tulis barisnya sendiri.
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

-- Chapters: publik bisa membaca; hanya author komik induk yang boleh tulis.
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

-- Chapter pages: publik bisa membaca; hanya author komik induk yang boleh tulis.
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

-- ------------------------------------------------------------
-- 6. Bucket Storage untuk media (sampul & halaman komik)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('komikinaja-media', 'komikinaja-media', true)
on conflict (id) do nothing;

-- Publik bisa membaca media.
drop policy if exists "Public read komikinaja media" on storage.objects;
create policy "Public read komikinaja media"
  on storage.objects for select
  using (bucket_id = 'komikinaja-media');

-- Pengguna login hanya bisa unggah ke folder miliknya sendiri (<uid>/...).
drop policy if exists "Users upload own media" on storage.objects;
create policy "Users upload own media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'komikinaja-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Pengguna login hanya bisa menghapus media miliknya sendiri.
drop policy if exists "Users delete own media" on storage.objects;
create policy "Users delete own media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'komikinaja-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
