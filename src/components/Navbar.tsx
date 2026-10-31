import React, { useState, useEffect } from 'react';
import { Bell, Menu, X, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getCoinBalance } from '../services/wallet';
import Logo from '../assets/logo_komikinaja.png';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
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
  
  return (
    <nav className="w-full bg-[#212844] px-4 md:px-8 py-4 flex flex-col sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4 md:gap-12">
          <button 
            className="md:hidden text-background" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('nav.closeMenu') : t('nav.menu')}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="KomikinAja Logo" className="h-8 md:h-10 object-contain" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-semibold text-sm">
            <Link to="/" className="text-background hover:text-amber-100">{t('nav.recommendation')}</Link>
            <Link to="/trending" className="text-background hover:text-amber-100">{t('nav.trending')}</Link>
            <Link to="/category" className="text-background hover:text-amber-100">{t('nav.category')}</Link>
            <Link to="/community" className="text-background hover:text-amber-100">{t('nav.community')}</Link>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {/* Dompet Koin Demo Link */}
          {user && (
            <Link
              to="/wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-200 transition-colors text-xs font-bold"
              title={`${t('nav.wallet')} (DEMO)`}
              aria-label={t('nav.wallet')}
            >
              <Coins size={15} className="text-amber-400" aria-hidden="true" />
              <span>{coinBalance ?? 0}</span>
              <span className="text-[10px] bg-amber-400/30 text-amber-300 px-1 py-0.2 rounded font-semibold tracking-wider">
                DEMO
              </span>
            </Link>
          )}

          {/* Notifikasi belum berfungsi (butuh backend) — dinonaktifkan dengan jelas */}
          <button 
            disabled
            title={t('common.soon')}
            aria-label={t('nav.notifications')}
            className="text-background opacity-50 cursor-not-allowed"
          >
            <Bell size={24} />
          </button>
          <Link to="/profile" aria-label={t('profile.account')} className="w-10 h-10 rounded-full overflow-hidden border-2 border-background hover:ring-2 ring-offset-2 ring-primary transition-all bg-white">
            <img 
              src={user?.avatar || "https://placehold.co/100x100/1F2544/FFFFFF/png?text=U"} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden flex flex-col gap-4 mt-4 pt-4 border-t border-gray-300 font-semibold text-sm">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-background hover:text-black">{t('nav.recommendation')}</Link>
          <Link to="/trending" onClick={() => setIsMobileMenuOpen(false)} className="text-background hover:text-black">{t('nav.trending')}</Link>
          <Link to="/category" onClick={() => setIsMobileMenuOpen(false)} className="text-background hover:text-black">{t('nav.category')}</Link>
          <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="text-background hover:text-black">{t('nav.community')}</Link>
          {user && (
            <Link
              to="/wallet"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-amber-300 hover:text-white flex items-center gap-2 pt-1 border-t border-white/10"
            >
              <Coins size={16} className="text-amber-400" aria-hidden="true" />
              <span>{t('nav.wallet')} ({coinBalance ?? 0} Koin — DEMO)</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
