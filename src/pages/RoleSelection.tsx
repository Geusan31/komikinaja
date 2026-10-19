import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft } from 'lucide-react';

export const RoleSelection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'reader' | 'author' | null>(null);
  const navigate = useNavigate();
  const { setRole, logout } = useAuth();
  const { t } = useLanguage();

  const handleContinue = async () => {
    if (selectedRole) {
      await setRole(selectedRole);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background relative">
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        aria-label={t('common.back')}
        className="absolute top-6 left-6 text-primary hover:bg-primary/10 p-2 rounded-full transition-colors z-50 cursor-pointer"
      >
        <ChevronLeft size={32} />
      </button>
      <Link to="/" className="text-5xl font-bold font-heading text-primary mb-8">
        K
      </Link>

      <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-heading">
        {t('role.title')}
      </h1>
      <p className="text-gray-800 mb-12 font-medium">
        {t('role.subtitle')}
      </p>

      <div className="w-full max-w-2xl flex flex-col gap-6 mb-12" role="group" aria-label={t('role.title')}>
        {/* Reader Option */}
        <button
          type="button"
          onClick={() => setSelectedRole('reader')}
          aria-pressed={selectedRole === 'reader'}
          className={`w-full p-8 rounded-2xl text-left cursor-pointer transition-all duration-300 ${
            selectedRole === 'reader'
              ? 'bg-primary text-white ring-4 ring-primary/30 scale-[1.02]'
              : 'bg-surface text-primary hover:bg-[#DED7C6]'
          }`}
        >
          <h2 className="text-3xl font-bold font-heading mb-2">{t('role.readerTitle')}</h2>
          <p className={`font-medium ${selectedRole === 'reader' ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('role.readerDesc')}
          </p>
        </button>

        {/* Author Option */}
        <button
          type="button"
          onClick={() => setSelectedRole('author')}
          aria-pressed={selectedRole === 'author'}
          className={`w-full p-8 rounded-2xl text-left cursor-pointer transition-all duration-300 ${
            selectedRole === 'author'
              ? 'bg-primary text-white ring-4 ring-primary/30 scale-[1.02]'
              : 'bg-surface text-primary hover:bg-[#DED7C6]'
          }`}
        >
          <h2 className="text-3xl font-bold font-heading mb-2">{t('role.authorTitle')}</h2>
          <p className={`font-medium ${selectedRole === 'author' ? 'text-gray-300' : 'text-gray-700'}`}>
            {t('role.authorDesc')}
          </p>
        </button>
      </div>

      <div className="w-full max-w-2xl">
        <Button
          fullWidth
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`py-4 text-xl rounded-2xl ${!selectedRole ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {t('role.continue')}
        </Button>
      </div>
    </div>
  );
};
