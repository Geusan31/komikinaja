import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/logo_komikinaja.png';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-10 flex flex-col">
      {/* Wave SVG */}
      <div className="w-full overflow-hidden leading-none flex">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[80px]">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C52.16,108.61,108.28,111.41,162.7,105.79Z" fill="#1F2544"></path>
        </svg>
      </div>

      <div className="bg-primary w-full pt-0 pb-20 px-8 text-white flex flex-col md:flex-row justify-between items-start -mt-1 relative z-10">
        <div className="max-w-sm mb-8 md:mb-0 text-left">
          <Link to="/" className="text-5xl font-bold font-heading inline-block mb-4">
            <img src={Logo} alt="KomikinAja Logo" className="h-8 md:h-10 object-contain" />
          </Link>
          <p className="text-sm text-gray-300 leading-relaxed">
            Tempat komik buat warga indonesia dan sekitarnya, update terus tiap hari.
          </p>
        </div>

        <div className="flex gap-16 text-left">
          <div className="flex flex-col gap-3">
            <h4 className="font-bold mb-2">BACA</h4>
            <Link to="#" className="text-sm text-gray-300 hover:text-white">MANHWA SUB INDONESIA</Link>
            <Link to="#" className="text-sm text-gray-300 hover:text-white">MANHUA SUB INDONESIA</Link>
            <Link to="#" className="text-sm text-gray-300 hover:text-white">MANGA SUB INDONESIA</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-bold mb-2">LINK</h4>
            <Link to="#" className="text-sm text-gray-300 hover:text-white">CONTACT US</Link>
            <Link to="#" className="text-sm text-gray-300 hover:text-white">DONATE US</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
