import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Edit2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AddComic: React.FC = () => {
  const navigate = useNavigate();
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [bahasa, setBahasa] = useState('');
  const [rating, setRating] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission and redirect
    alert('Komik berhasil ditambahkan!');
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        
        {/* Cover Image Upload Area */}
        <div className="relative mb-10 group cursor-pointer">
          <div className="w-48 h-64 rounded-xl overflow-hidden shadow-xl relative bg-gray-200">
            <img 
              src="https://placehold.co/400x600/EAE3D2/1F2544/png?text=Cover+Komik" 
              alt="Comic Cover" 
              className="w-full h-full object-cover group-hover:brightness-75 transition-all"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Edit2 size={24} className="text-[#1F2544]" />
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 text-[#1F2544]">
          
          <div className="flex flex-col gap-2 text-left">
            <label className="font-bold text-lg">Judul</label>
            <input 
              type="text" 
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full bg-[#EAE3D2] p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#1F2544] font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label className="font-bold text-lg">Deskripsi</label>
            <textarea 
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full bg-[#EAE3D2] p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#1F2544] min-h-[120px] resize-none font-medium"
              required
            ></textarea>
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label className="font-bold text-lg">Bahasa</label>
            <input 
              type="text" 
              value={bahasa}
              onChange={(e) => setBahasa(e.target.value)}
              className="w-full bg-[#EAE3D2] p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#1F2544] font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label className="font-bold text-lg">Rating</label>
            <input 
              type="text" 
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full bg-[#EAE3D2] p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#1F2544] font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-2 text-left mb-4">
            <label className="font-bold text-lg">Upload karya (dalam bentuk pdf)</label>
            <div className="w-full bg-[#EAE3D2] h-32 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#DED7C6] transition-colors border-2 border-dashed border-transparent hover:border-gray-400">
              <div className="bg-[#F4EFE6] p-2 rounded-full">
                <Plus size={24} className="text-[#1F2544]" />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button 
              type="submit" 
              className="px-10 py-3 bg-[#1F2544] text-white font-bold rounded-full hover:bg-black transition-colors"
            >
              Submit
            </button>
          </div>
          
        </form>

      </main>

      <Footer />
    </div>
  );
};
