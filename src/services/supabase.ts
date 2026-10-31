import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Klien Supabase tunggal untuk seluruh aplikasi.
 *
 * Nilai diambil dari environment variable Vite (lihat `.env.example`).
 * Jika belum dikonfigurasi, `supabase` akan `null` dan `isSupabaseConfigured`
 * menjadi `false` — aplikasi tetap bisa jalan tanpa crash (mode mock di M1).
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Pesan yang ditampilkan ke pengguna bila Supabase belum diisi di `.env`.
 * Dipakai di halaman auth supaya tidak diam-diam gagal.
 */
export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env lalu restart server dev.';
