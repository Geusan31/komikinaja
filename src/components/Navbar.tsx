import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, Coins, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getCoinBalance } from '../services/wallet';
import Logo from '../assets/logo_komikinaja.png';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mode, resolvedTheme, cycleQuickMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const updateBalance = () => {
      getCoinBalance(user.id).then((b) => {
        if (!cancelled) setCoinBalance(b);
      });
    };
    updateBalance();
    window.addEventListener('storage', updateBalance);
    window.addEventListener('focus', updateBalance);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', updateBalance);
      window.removeEventListener('focus', updateBalance);
    };
  }, [user]);

  const displayBalance = user ? (coinBalance ?? 0) : 0;
  const themeLabel =
    mode === 'auto' ? t('theme.auto') : mode === 'dark' ? t('theme.dark') : t('theme.light');

  return (
    <nav className="w-full bg-[var(--color-nav)] px-4 md:px-8 py-3.5 flex flex-col sticky top-0 z-50 shadow-sm border-b border-white/10">
      <div className="flex items-center justify-between w-full min-h-11">
        <div className="flex items-center gap-4 md:gap-10">
          <button
            type="button"
            className="md:hidden text-[#F4EFE6] p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-w-11 min-h-11 flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('nav.closeMenu') : t('nav.menu')}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex items-center">
            <img src={Logo} alt="KomikinAja Logo" className="h-8 md:h-9 object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-7 font-semibold text-sm">
            <Link to="/" className="text-[#F4EFE6] hover:text-amber-100 transition-colors">
              {t('nav.recommendation')}
            </Link>
            <Link to="/trending" className="text-[#F4EFE6] hover:text-amber-100 transition-colors">
              {t('nav.trending')}
            </Link>
            <Link to="/category" className="text-[#F4EFE6] hover:text-amber-100 transition-colors">
              {t('nav.category')}
            </Link>
            <Link to="/community" className="text-[#F4EFE6] hover:text-amber-100 transition-colors">
              {t('nav.community')}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {user && (
            <Link
              to="/wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-10 rounded-lg bg-white/10 hover:bg-white/15 text-[#F4EFE6] transition-colors text-xs font-semibold border border-white/15"
              title={`${t('nav.wallet')} (Simulasi)`}
              aria-label={t('nav.wallet')}
            >
              <Coins size={14} className="text-amber-300" aria-hidden="true" />
              <span>{displayBalance}</span>
              <span className="text-[10px] text-gray-300 font-normal hidden sm:inline">
                {t('nav.coins')}
              </span>
            </Link>
          )}

          {/* Quick Theme Switcher (Auto / Dark / Light) */}
          <button
            type="button"
            onClick={cycleQuickMode}
            title={t('theme.toggleLabel', { mode: themeLabel })}
            aria-label={t('theme.toggleLabel', { mode: themeLabel })}
            className="relative flex items-center justify-center min-w-10 min-h-10 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#F4EFE6] transition-colors border border-white/15 cursor-pointer gap-1"
          >
            {resolvedTheme === 'dark' ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
            {mode === 'auto' && (
              <span className="text-[10px] font-bold uppercase tracking-tight text-amber-200">
                Auto
              </span>
            )}
          </button>

          {/* Notifikasi belum berfungsi (butuh backend) — dinonaktifkan dengan jelas */}
          <button
            type="button"
            disabled
            title={t('common.soon')}
            aria-label={t('nav.notifications')}
            className="text-[#F4EFE6] opacity-50 cursor-not-allowed min-w-10 min-h-10 flex items-center justify-center"
          >
            <Bell size={22} />
          </button>

          <Link
            to="/profile"
            aria-label={t('profile.account')}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F4EFE6] hover:ring-2 ring-offset-2 ring-amber-200 transition-all bg-white shrink-0"
          >
            <img
              src={user?.avatar || 'https://placehold.co/100x100/1F2544/FFFFFF/png?text=U'}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex flex-col gap-1.5 mt-3 pt-3 border-t border-white/15 font-semibold text-sm">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[#F4EFE6] hover:text-amber-100 hover:bg-white/10 rounded-lg px-3 py-2.5 transition-colors"
          >
            {t('nav.recommendation')}
          </Link>
          <Link
            to="/trending"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[#F4EFE6] hover:text-amber-100 hover:bg-white/10 rounded-lg px-3 py-2.5 transition-colors"
          >
            {t('nav.trending')}
          </Link>
          <Link
            to="/category"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[#F4EFE6] hover:text-amber-100 hover:bg-white/10 rounded-lg px-3 py-2.5 transition-colors"
          >
            {t('nav.category')}
          </Link>
          <Link
            to="/community"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-[#F4EFE6] hover:text-amber-100 hover:bg-white/10 rounded-lg px-3 py-2.5 transition-colors"
          >
            {t('nav.community')}
          </Link>
          {user && (
            <Link
              to="/wallet"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-[#F4EFE6] hover:text-amber-100 hover:bg-white/10 rounded-lg px-3 py-2.5 flex items-center gap-2 mt-1 border-t border-white/15 font-semibold transition-colors"
            >
              <Coins size={16} className="text-amber-300" aria-hidden="true" />
              <span>
                {t('nav.wallet')} ({displayBalance} {t('nav.coins')})
              </span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
