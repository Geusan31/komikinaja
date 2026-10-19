import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Edit2, Plus, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const AddComic: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [bahasa, setBahasa] = useState('');
  const [rating, setRating] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Backend belum terintegrasi (M4). Form hanya simulasi — beri tahu user dengan jujur.
    alert(t('addComic.soonNotice'));
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">

        <h1 className="text-3xl font-bold font-heading text-primary mb-6 self-start">{t('addComic.title')}</h1>

        {/* Notice jujur — form ini belum terhubung penyimpanan */}
        <div className="w-full bg-surface/70 border border-primary/10 rounded-xl p-4 flex items-start gap-3 mb-10 text-left">
          <Info size={20} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-gray-700">{t('addComic.soonNotice')}</p>
        </div>

        {/* Cover Image Upload Area */}
        <div className="relative mb-10 group">
          <div className="w-48 h-64 rounded-xl overflow-hidden shadow-xl relative bg-gray-200">
            <img
              src="https://placehold.co/400x600/EAE3D2/1F2544/png?text=Cover+Komik"
              alt={t('addComic.cover')}
              className="w-full h-full object-cover group-hover:brightness-75 transition-all"
            />
          </div>
          <span
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed"
            title={t('common.soon')}
            aria-disabled="true"
          >
            <span className="bg-white p-3 rounded-full shadow-lg">
              <Edit2 size={24} className="text-primary" aria-hidden="true" />
            </span>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 text-primary">

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="judul" className="font-bold text-lg">{t('addComic.titleField')}</label>
            <input
              id="judul"
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full bg-surface p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="deskripsi" className="font-bold text-lg">{t('addComic.description')}</label>
            <textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full bg-surface p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-none font-medium"
              required
            ></textarea>
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="bahasa" className="font-bold text-lg">{t('addComic.language')}</label>
            <input
              id="bahasa"
              type="text"
              value={bahasa}
              onChange={(e) => setBahasa(e.target.value)}
              className="w-full bg-surface p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="rating" className="font-bold text-lg">{t('addComic.rating')}</label>
            <input
              id="rating"
              type="text"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full bg-surface p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-2 text-left mb-4">
            <span className="font-bold text-lg">{t('addComic.upload')}</span>
            <span
              className="w-full bg-surface h-32 rounded-xl flex items-center justify-center cursor-not-allowed hover:bg-[#DED7C6] transition-colors border-2 border-dashed border-transparent opacity-70"
              title={t('common.soon')}
              aria-disabled="true"
            >
              <span className="bg-background p-2 rounded-full">
                <Plus size={24} className="text-primary" aria-hidden="true" />
              </span>
            </span>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              className="px-10 py-3 bg-primary text-white font-bold rounded-full hover:bg-black transition-colors"
            >
              {t('addComic.submit')}
            </button>
          </div>

        </form>

      </main>

      <Footer />
    </div>
  );
};
