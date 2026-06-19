import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (user && !user.role && location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
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

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/category" element={<ProtectedRoute><Category /></ProtectedRoute>} />
      <Route path="/trending" element={<ProtectedRoute><Trending /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/add-comic" element={<ProtectedRoute><AddComic /></ProtectedRoute>} />
      <Route path="/comic/:id" element={<ProtectedRoute><ComicDetail /></ProtectedRoute>} />
      <Route path="/read/:id/:episode" element={<ProtectedRoute><ReadingMode /></ProtectedRoute>} />
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
