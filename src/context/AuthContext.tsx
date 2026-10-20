/* eslint-disable react-refresh/only-export-components --
   Pola React context idiomatik: Provider (komponen) dan hook useAuth
   di file yang sama agar konteksnya mudah ditemukan. Rule ini hanya
   peduli pada fast-refresh/HMR, bukan kualitas kode. */
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from '../services/supabase';

type Role = 'reader' | 'author' | null;

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  /** Metode masuk ('email' | 'google' | ...), dari app_metadata Supabase. */
  provider: string;
  /** Admin internal (untuk moderasi, S1). */
  isAdmin: boolean;
  /** Akun diblokir admin (S1) — diblokir dari seluruh rute terproteksi. */
  isBanned: boolean;
}

interface AuthResult {
  error: string | null;
  /** Benar bila pendaftaran berhasil tapi email perlu dikonfirmasi dulu. */
  needsEmailConfirm?: boolean;
}

interface AuthContextType {
  user: User | null;
  /** Selagi sesi Supabase belum siap, jangan render halaman terproteksi. */
  loading: boolean;
  isSupabaseConfigured: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  setRole: (role: Role) => Promise<void>;
  updateProfile: (data: { username?: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Gabungkan data Supabase auth + baris profil menjadi tipe User aplikasi. */
const buildUser = (authUser: SupabaseAuthUser, profile?: { username?: string | null; avatar_url?: string | null; role?: Role; is_admin?: boolean; banned_at?: string | null }): User => {
  const email = authUser.email ?? '';
  const name =
    profile?.username ??
    (authUser.user_metadata?.username as string | undefined) ??
    email.split('@')[0] ??
    'Pengguna';
  const avatar =
    profile?.avatar_url ??
    (authUser.user_metadata?.avatar_url as string | undefined) ??
    `https://placehold.co/200x200/1F2544/FFFFFF/png?text=${encodeURIComponent(name.charAt(0).toUpperCase())}`;

  return {
    id: authUser.id,
    name,
    email,
    avatar,
    role: profile?.role ?? null,
    provider: (authUser.app_metadata?.provider as string | undefined) ?? 'email',
    isAdmin: profile?.is_admin ?? false,
    isBanned: profile?.banned_at != null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const client = supabase;
    // Saat Supabase belum dikonfigurasi, `loading` sudah false dari nilai awal,
    // jadi tidak perlu memanggil setState di sini.
    if (!client) return;

    // Muat profil (role, username) dari tabel profiles untuk satu pengguna.
    const loadProfile = async (authUser: SupabaseAuthUser): Promise<User> => {
      const { data } = await client
        .from('profiles')
        .select('username, avatar_url, role, is_admin, banned_at')
        .eq('id', authUser.id)
        .single();
      return buildUser(authUser, data ?? undefined);
    };

    // Sesi awal saat aplikasi dibuka.
    client.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await loadProfile(session.user));
      }
      setLoading(false);
    });

    // Sinkronkan setiap kali status auth berubah (login/logout/token refresh).
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user).then(setUser).catch(() => setUser(buildUser(session.user)));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: name } },
    });
    if (error) return { error: error.message };
    // Jika konfirmasi email aktif, Supabase tidak mengembalikan sesi.
    return { error: null, needsEmailConfirm: !data.session };
  };

  const loginWithGoogle = async (): Promise<AuthResult> => {
    if (!supabase) return { error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const setRole = async (role: Role): Promise<void> => {
    if (!supabase || !user) return;
    const { error } = await supabase.from('profiles').update({ role }).eq('id', user.id);
    if (!error) setUser((prev) => (prev ? { ...prev, role } : prev));
  };

  const updateProfile = async ({ username }: { username?: string }): Promise<AuthResult> => {
    if (!supabase || !user) return { error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    const patch: Record<string, unknown> = {};
    if (username !== undefined) patch.username = username;
    const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
    if (error) return { error: error.message };
    if (username !== undefined) setUser((prev) => (prev ? { ...prev, name: username } : prev));
    return { error: null };
  };

  const logout = async (): Promise<void> => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isSupabaseConfigured, login, register, loginWithGoogle, setRole, updateProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
