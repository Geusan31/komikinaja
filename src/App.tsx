import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BannedScreen } from './components/BannedScreen';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RoleSelection } from './pages/RoleSelection';
import { Category } from './pages/Category';
import { Trending } from './pages/Trending';
import { Profile } from './pages/Profile';
import { ComicDetail } from './pages/ComicDetail';
import { ReadingMode } from './pages/ReadingMode';
import { AddComic } from './pages/AddComic';
import { Admin } from './pages/Admin';
import { CommunityList } from './pages/CommunityList';
import { CommunityDetail } from './pages/CommunityDetail';
import { WalletPage } from './pages/WalletPage';
import { CreatorProfile } from './pages/CreatorProfile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Selagi sesi Supabase belum siap, jangan putuskan arah dulu.
  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Akun yang diblokir admin tidak boleh mengakses rute manapun (S1).
  if (user.isBanned) {
    return <BannedScreen />;
  }

  if (user && !user.role && location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

/** Rute khusus admin — selain isBanned/role, harus is_admin. */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.isBanned) return <BannedScreen />;
  if (!user.isAdmin) return <Navigate to="/profile" replace />;

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user && user.role) {
    return <Navigate to="/" replace />;
  }
  if (user && !user.role) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Semi-Protected (Needs user but not necessarily role) */}
      <Route path="/role-selection" element={
        <ProtectedRoute>
          <RoleSelection />
        </ProtectedRoute>
      } />

      {/* Protected Routes — tiap route punya error boundary sendiri
          agar satu halaman gagal tidak mematikan seluruh aplikasi */}
      <Route path="/" element={<ProtectedRoute><ErrorBoundary sectionName="beranda"><Home /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/category" element={<ProtectedRoute><ErrorBoundary sectionName="kategori"><Category /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/trending" element={<ProtectedRoute><ErrorBoundary sectionName="trending"><Trending /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ErrorBoundary sectionName="profil"><Profile /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/add-comic" element={<ProtectedRoute><ErrorBoundary sectionName="tambah komik"><AddComic /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/comic/:id" element={<ProtectedRoute><ErrorBoundary sectionName="detail komik"><ComicDetail /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/read/:id/:episode" element={<ProtectedRoute><ErrorBoundary sectionName="mode baca"><ReadingMode /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><ErrorBoundary sectionName="admin"><Admin /></ErrorBoundary></AdminRoute>} />
      <Route path="/community" element={<ProtectedRoute><ErrorBoundary sectionName="komunitas"><CommunityList /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/community/:id" element={<ProtectedRoute><ErrorBoundary sectionName="detail komunitas"><CommunityDetail /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><ErrorBoundary sectionName="dompet koin"><WalletPage /></ErrorBoundary></ProtectedRoute>} />
      <Route path="/creator/:authorId" element={<ProtectedRoute><ErrorBoundary sectionName="profil kreator"><CreatorProfile /></ErrorBoundary></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
