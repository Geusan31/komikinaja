import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginColumn1, loginColumn2, loginColumn3 } from '../data/dummy';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    login({ name: 'New User', email: 'user@komikinaja.com', avatar: 'https://dummyimage.com/200x200/1F2544/FFFFFF.png&text=U' });
    navigate('/role-selection');
  };

  return (
    <div className="min-h-screen flex text-left">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col">
        <Link to="/" className="text-4xl font-bold font-heading text-primary mb-12">
          K
        </Link>

        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-4xl font-bold text-primary mb-4 font-heading whitespace-pre-line">
            {t('register.title')}
          </h1>
          <p className="text-gray-800 mb-8 font-medium">
            {t('register.subtitle')}
          </p>

          <form onSubmit={handleRegister}>
            <Input
              type="text"
              placeholder={t('register.fullName')}
              required
            />
            <Input
              type="email"
              placeholder={t('register.email')}
              required
            />
            <Input
              isPassword
              placeholder={t('register.password')}
              required
            />

            <div className="flex items-center mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-primary font-medium">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600 accent-teal-600" required />
                {t('register.terms')}
              </label>
            </div>

            <Button type="submit" fullWidth className="mb-6">
              {t('register.signUp')}
            </Button>

            {/* Google register hanya tampil setelah OAuth dikonfigurasi (M2) */}
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled
              title={t('common.soon')}
              className="border border-primary flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
              {t('register.googleSoon')}
            </Button>
          </form>

          <p className="mt-8 text-left text-sm text-gray-500">
            {t('register.haveAccount')} <Link to="/login" className="text-primary font-bold hover:underline">{t('register.signInLink')}</Link>
          </p>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:grid w-1/2 grid-cols-3 gap-4 p-4 overflow-hidden max-h-screen bg-surface relative" aria-hidden="true">
        <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDuration: '35s' }}>
          {loginColumn1.map((src, idx) => (
            <img key={`c1-${idx}`} src={src} alt="" className="w-full h-auto rounded-xl shadow-lg object-cover" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-slide-down" style={{ animationDuration: '40s' }}>
          {loginColumn2.map((src, idx) => (
            <img key={`c2-${idx}`} src={src} alt="" className="w-full h-auto rounded-xl shadow-lg object-cover" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDuration: '38s' }}>
          {loginColumn3.map((src, idx) => (
            <img key={`c3-${idx}`} src={src} alt="" className="w-full h-auto rounded-xl shadow-lg object-cover" />
          ))}
        </div>
      </div>
    </div>
  );
};
