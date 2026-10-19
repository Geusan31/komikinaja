-- ============================================================
-- KomikinAja — Migrasi awal (M2: akun nyata)
-- Jalankan di Supabase SQL Editor, atau via CLI:
--   supabase db push
--
-- Isi: tabel profiles & favorites, Row Level Security (RLS),
-- dan trigger untuk membuat profil otomatis saat pendaftaran.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabel profiles
-- Satu baris per pengguna, terhubung ke auth.users milik Supabase.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text,
  avatar_url text,
  -- Peran dipilih pengguna saat pertama kali masuk (role-selection).
  role       text check (role in ('reader', 'author')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profil publik tiap pengguna, terhubung ke auth.users.';

-- ------------------------------------------------------------
-- 2. Tabel favorites
-- Menyimpan komik (metadata Kitsu) yang difavoritkan pengguna.
-- comic_id adalah id manga di Kitsu (string numerik).
-- ------------------------------------------------------------
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  comic_id    text not null,
  comic_title text not null,
  comic_cover text,
  created_at  timestamptz not null default now(),
  -- Satu pengguna tidak boleh memfavoritkan komik yang sama dua kali.
  unique (user_id, comic_id)
);

comment on table public.favorites is 'Daftar komik favorit per pengguna (metadata Kitsu).';

-- Index untuk mengambil favorit satu pengguna dengan cepat.
create index if not exists favorites_user_id_idx on public.favorites (user_id);

-- ------------------------------------------------------------
-- 3. Fungsi & trigger: buat profil otomatis saat user baru dibuat
-- Mengisi username & avatar dari metadata pendaftaran.
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- Aktifkan RLS lalu definisikan kebijakan akses per baris.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;

-- Profil: siapa pun bisa membaca (untuk tampilan publik),
-- tapi hanya pemilik yang boleh mengubah barisnya sendiri.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Favorit: hanya pemilik yang bisa melihat, menambah, menghapus barisnya.
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

-- ------------------------------------------------------------
-- 5. Fungsi bantu: perbarui updated_at saat baris diubah
-- ------------------------------------------------------------
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
