import React, { useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../assets/logo_komikinaja.png';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="w-full bg-[#212844] px-4 md:px-8 py-4 flex flex-col sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4 md:gap-12">
          <button 
            className="md:hidden text-[#F4EFE6]" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          
          <Link to="/" className="flex items-center">
            <img src={Logo} alt="KomikinAja Logo" className="h-8 md:h-10 object-contain" />
          </Link>
          
          <div className="hidden md:flex items-center gap-8 font-semibold text-sm">
            <Link to="/" className="text-[#F4EFE6] hover:text-black">{t('nav.recommendation')}</Link>
            <Link to="/trending" className="text-[#F4EFE6] hover:text-black">{t('nav.trending')}</Link>
            <Link to="/category" className="text-[#F4EFE6] hover:text-black">{t('nav.category')}</Link>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button className="text-[#F4EFE6] hover:text-black">
            <Bell size={24} />
          </button>
          <Link to="/profile" className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F4EFE6] hover:ring-2 ring-offset-2 ring-[#1F2544] transition-all bg-white">
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
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F4EFE6] hover:text-black">{t('nav.recommendation')}</Link>
          <Link to="/trending" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F4EFE6] hover:text-black">{t('nav.trending')}</Link>
          <Link to="/category" onClick={() => setIsMobileMenuOpen(false)} className="text-[#F4EFE6] hover:text-black">{t('nav.category')}</Link>
        </div>
      )}
    </nav>
  );
};
