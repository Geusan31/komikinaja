import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft } from 'lucide-react';

export const RoleSelection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'reader' | 'author' | null>(null);
  const navigate = useNavigate();
  const { setRole, logout } = useAuth();

  const handleContinue = () => {
    if (selectedRole) {
      setRole(selectedRole);
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
        className="absolute top-6 left-6 text-primary hover:bg-primary/10 p-2 rounded-full transition-colors z-50 cursor-pointer"
      >
        <ChevronLeft size={32} />
      </button>
      <Link to="/" className="text-5xl font-bold font-heading text-primary mb-8">
        K
      </Link>
      
      <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 font-heading">
        Kamu mau jadi apa di KomikinAja?
      </h1>
      <p className="text-gray-800 mb-12 font-medium">
        Pilih peran yang sesuai kamu banget! Kamu bisa mengubahnya kapan saja di pengaturan.
      </p>

      <div className="w-full max-w-2xl flex flex-col gap-6 mb-12">
        {/* Reader Option */}
        <div 
          onClick={() => setSelectedRole('reader')}
          className={`w-full p-8 rounded-2xl text-left cursor-pointer transition-all duration-300 ${
            selectedRole === 'reader' 
              ? 'bg-primary text-white ring-4 ring-primary/30 scale-[1.02]' 
              : 'bg-surface text-primary hover:bg-[#DED7C6]'
          }`}
        >
          <h2 className="text-3xl font-bold font-heading mb-2">Pembaca</h2>
          <p className={`font-medium ${selectedRole === 'reader' ? 'text-gray-300' : 'text-gray-700'}`}>
            Nikmati ribuan komik, manga, manhwa, dan manhua dari seluruh dunia.
          </p>
        </div>

        {/* Author Option */}
        <div 
          onClick={() => setSelectedRole('author')}
          className={`w-full p-8 rounded-2xl text-left cursor-pointer transition-all duration-300 ${
            selectedRole === 'author' 
              ? 'bg-primary text-white ring-4 ring-primary/30 scale-[1.02]' 
              : 'bg-surface text-primary hover:bg-[#DED7C6]'
          }`}
        >
          <h2 className="text-3xl font-bold font-heading mb-2">Author</h2>
          <p className={`font-medium ${selectedRole === 'author' ? 'text-gray-300' : 'text-gray-700'}`}>
            Publikasikan karya kamu dan bangun basis pembaca yang loyal.
          </p>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        <Button 
          fullWidth 
          onClick={handleContinue}
          disabled={!selectedRole}
          className={`py-4 text-xl rounded-2xl ${!selectedRole ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );
};
