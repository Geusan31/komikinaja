import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

/**
 * Layar untuk akun yang diblokir admin (S1). Menggantikan seluruh
 * rute terproteksi sehingga pengguna yang diblokir tidak bisa memakai
 * aplikasi sampai dibuka kembali blokirnya.
 */
export const BannedScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <ShieldAlert size={32} className="text-red-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-primary">{t('ban.title')}</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          {user?.name ? t('ban.descNamed') : t('ban.desc')}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-2 px-8 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors"
        >
          {t('ban.logout')}
        </button>
      </div>
    </div>
  );
};
