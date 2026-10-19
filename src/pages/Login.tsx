import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginColumn1, loginColumn2, loginColumn3 } from '../data/dummy';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: loginError } = await login(email, password);
    setSubmitting(false);
    if (loginError) {
      setError(loginError);
      return;
    }
    // setRole di AuthContext; ProtectedRoute akan mengarahkan sesuai ada-tidaknya role.
    navigate('/', { replace: true });
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleSubmitting(true);
    const { error: googleError } = await loginWithGoogle();
    setGoogleSubmitting(false);
    // Bila provider Google belum diaktifkan, Supabase mengembalikan pesan yang kita tampilkan apa adanya.
    if (googleError) setError(googleError);
  };

  return (
    <div className="min-h-screen flex text-left">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col">
        <Link to="/" className="text-4xl font-bold font-heading text-primary mb-16">
          K
        </Link>

        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-4xl font-bold text-primary mb-4 font-heading whitespace-pre-line">
            {t('login.title')}
          </h1>
          <p className="text-gray-800 mb-8 font-medium">
            {t('login.subtitle')}
          </p>

          <form onSubmit={handleLogin}>
            <Input
              type="email"
              placeholder="Namamail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              isPassword
              placeholder="Masukkan Sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <p role="alert" className="text-red-500 text-sm mb-4 text-left">{error}</p>
            )}

            <div className="flex items-center justify-between mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-primary font-medium">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600 accent-teal-600" defaultChecked />
                {t('login.remember')}
              </label>
              {/* Link "Lupa Sandi" dinonaktifkan sementara — fitur reset password butuh alur email */}
              <span className="text-gray-400 font-medium cursor-not-allowed" title={t('common.soon')}>
                {t('login.forgot')}
              </span>
            </div>

            <Button type="submit" fullWidth className="mb-6" disabled={submitting}>
              {submitting ? t('common.loading') : t('login.signIn')}
            </Button>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleGoogle}
              disabled={googleSubmitting}
              className="border border-primary"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" />
              {googleSubmitting ? t('common.loading') : t('login.google')}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            {t('login.noAccount')} <Link to="/register" className="text-primary font-bold hover:underline">{t('login.registerLink')}</Link>
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
