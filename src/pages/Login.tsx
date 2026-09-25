import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { loginCredentials, loginColumn1, loginColumn2, loginColumn3 } from '../data/dummy';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check dummy credentials
    if (email === loginCredentials.reader.email && password === loginCredentials.reader.password) {
      login({ name: loginCredentials.reader.name, email, avatar: 'https://placehold.co/200x200/1F2544/FFFFFF/png?text=R' });
      navigate('/role-selection');
    } else if (email === loginCredentials.author.email && password === loginCredentials.author.password) {
      login({ name: loginCredentials.author.name, email, avatar: 'https://placehold.co/200x200/FF5722/FFFFFF/png?text=A' });
      navigate('/role-selection');
    } else {
      setError('Email atau password salah. Coba: reader@komikinaja.com atau author@komikinaja.com dengan password: password123');
    }
  };

  const handleGoogleLogin = () => {
    login({ name: 'Google User', email: 'google@komikinaja.com', avatar: 'https://placehold.co/200x200/1F2544/FFFFFF/png?text=G' });
    navigate('/role-selection');
  };

  return (
    <div className="min-h-screen flex text-left">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col">
        <Link to="/" className="text-4xl font-bold font-heading text-primary mb-16">
          K
        </Link>
        
        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-4xl font-bold text-primary mb-4 font-heading">
            Selamat Datang<br/>Kembali!
          </h1>
          <p className="text-gray-800 mb-8 font-medium">
            Masuk untuk melanjutkan bacaan favoritmu dan jelajahi ribuan koleksi manga terbaru
          </p>

          <form onSubmit={handleLogin}>
            <Input 
              type="email" 
              placeholder="Namamail@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <Input 
              isPassword 
              placeholder="Masukkan Sandi" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            
            {error && <p className="text-red-500 text-sm mb-4 text-left">{error}</p>}
            
            <div className="flex items-center justify-between mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-primary font-medium">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600 accent-teal-600" defaultChecked />
                Ingat sebagi Saya
              </label>
              <a href="#" className="text-primary hover:underline font-medium">Lupa Sandi?</a>
            </div>

            <Button type="submit" fullWidth className="mb-6">
              Sign In
            </Button>
            
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={handleGoogleLogin}
              className="border border-primary flex items-center justify-center gap-2"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Masuk dengan Google
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Belum punya akun? <Link to="/register" className="text-primary font-bold hover:underline">Buat akun baru</Link>
          </p>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:grid w-1/2 grid-cols-3 gap-4 p-4 overflow-hidden max-h-screen bg-surface relative">
        <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDuration: '35s' }}>
          {loginColumn1.map((src, idx) => (
            <img key={`c1-${idx}`} src={src} alt="Poster" className="w-full h-auto rounded-xl shadow-lg object-cover" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-slide-down" style={{ animationDuration: '40s' }}>
          {loginColumn2.map((src, idx) => (
            <img key={`c2-${idx}`} src={src} alt="Poster" className="w-full h-auto rounded-xl shadow-lg object-cover" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-slide-up" style={{ animationDuration: '38s' }}>
          {loginColumn3.map((src, idx) => (
            <img key={`c3-${idx}`} src={src} alt="Poster" className="w-full h-auto rounded-xl shadow-lg object-cover" />
          ))}
        </div>
      </div>
    </div>
  );
};
