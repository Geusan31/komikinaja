import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { mangas } from '../data/dummy';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/login');
  };

  const handleGoogleRegister = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex text-left">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col">
        <Link to="/" className="text-4xl font-bold font-heading text-[#1F2544] mb-12">
          K
        </Link>
        
        <div className="max-w-md w-full mx-auto my-auto">
          <h1 className="text-4xl font-bold text-[#1F2544] mb-4 font-heading">
            Mulai Petualanganmu<br/>di KomikinAja!
          </h1>
          <p className="text-gray-800 mb-8 font-medium">
            Daftar sekarang untuk akses ribuan koleksi manga, manhwa, dan manhua terpopuler.
          </p>

          <form onSubmit={handleRegister}>
            <Input 
              type="text" 
              placeholder="Nama Panjang" 
              required 
            />
            <Input 
              type="email" 
              placeholder="Namamail@gmail.com" 
              required 
            />
            <Input 
              isPassword 
              placeholder="Sandi" 
              required 
            />
            
            <div className="flex items-center mb-8 text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-[#1F2544] font-medium">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-600 accent-teal-600" required />
                Saya menyetujui Syarat & Ketentuan
              </label>
            </div>

            <Button type="submit" fullWidth className="mb-6">
              Sign up
            </Button>
            
            <Button 
              type="button" 
              variant="secondary" 
              fullWidth 
              onClick={handleGoogleRegister}
              className="border border-[#1F2544] flex items-center justify-center gap-2"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Masuk dengan Google
            </Button>
          </form>

          <p className="mt-8 text-left text-sm text-gray-500">
            Sudah punya akun? <Link to="/login" className="text-[#1F2544] font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:grid w-1/2 grid-cols-3 gap-4 p-8 overflow-hidden max-h-screen bg-[#EAE3D2]">
        <div className="flex flex-col gap-4 animate-marquee-reverse">
          {mangas.slice(0, 4).map((manga) => (
            <img key={manga.id} src={manga.cover} alt={manga.title} className="w-full h-auto rounded-lg shadow-md" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-marquee">
          {mangas.slice(4, 8).map((manga) => (
            <img key={manga.id} src={manga.cover} alt={manga.title} className="w-full h-auto rounded-lg shadow-md" />
          ))}
        </div>
        <div className="flex flex-col gap-4 animate-marquee-reverse">
          {mangas.slice(2, 6).map((manga) => (
            <img key={manga.id} src={manga.cover} alt={manga.title} className="w-full h-auto rounded-lg shadow-md" />
          ))}
        </div>
      </div>
    </div>
  );
};
