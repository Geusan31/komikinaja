/* eslint-disable react-refresh/only-export-components --
   Pola React context idiomatik: Provider (komponen) dan hook useAuth
   di file yang sama agar konteksnya mudah ditemukan. Rule ini hanya
   peduli pada fast-refresh/HMR, bukan kualitas kode. */
import React, { createContext, useContext, useState } from 'react';

type Role = 'reader' | 'author' | null;

interface User {
  name: string;
  email: string;
  avatar: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  login: (userData: Omit<User, 'role'>) => void;
  setRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Baca sesi tersimpan saat inisialisasi (lazy initializer) agar tidak perlu
  // setState sinkron di dalam useEffect.
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = sessionStorage.getItem('komikinaja_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as User;
      } catch {
        sessionStorage.removeItem('komikinaja_user');
      }
    }
    return null;
  });

  const login = (userData: Omit<User, 'role'>) => {
    const newUser = { ...userData, role: null };
    setUser(newUser);
    sessionStorage.setItem('komikinaja_user', JSON.stringify(newUser));
  };

  const setRole = (role: Role) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      sessionStorage.setItem('komikinaja_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('komikinaja_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, setRole, logout }}>
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
