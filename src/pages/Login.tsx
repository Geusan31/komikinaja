import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { mangas, loginCredentials } from '../data/dummy';
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
        <Link to="/" className="text-4xl font-bold font-heading text-[#1F2544] mb-16">
          K
        </Link>
        
        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-4xl font-bold text-[#1F2544] mb-4 font-heading">
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
              <label className="flex items-center gap-2 cursor-pointer text-[#1F2544] font-medium">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600 accent-teal-600" defaultChecked />
                Ingat sebagi Saya
              </label>
              <a href="#" className="text-[#1F2544] hover:underline font-medium">Lupa Sandi?</a>
            </div>

            <Button type="submit" fullWidth className="mb-6">
              Sign In
            </Button>
            
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={handleGoogleLogin}
              className="border border-[#1F2544] flex items-center justify-center gap-2"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Masuk dengan Google
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Belum punya akun? <Link to="/register" className="text-[#1F2544] font-bold hover:underline">Buat akun baru</Link>
          </p>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:grid w-1/2 grid-cols-3 gap-4 p-8 overflow-hidden max-h-screen bg-[#EAE3D2]">
        <div className="flex flex-col gap-4 animate-marquee">
          {mangas.slice(0, 4).map((manga) => (
            <img key={manga.id} src={manga.cover} alt={manga.title} className="w-full h-auto rounded-lg shadow-md" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-marquee-reverse">
          {mangas.slice(4, 8).map((manga) => (
            <img key={manga.id} src={manga.cover} alt={manga.title} className="w-full h-auto rounded-lg shadow-md" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-marquee">
          {mangas.slice(2, 6).map((manga) => (
            <img key={manga.id} src={manga.cover} alt={manga.title} className="w-full h-auto rounded-lg shadow-md" />
          ))}
        </div>
      </div>
    </div>
  );
};
