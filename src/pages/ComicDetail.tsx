import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchMangaDetail } from '../services/api';
import { dummyEpisodes, dummyComments } from '../data/dummy';
import { ChevronLeft, ChevronRight, Eye, Bookmark, Heart } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const ComicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      if (id) {
        const data = await fetchMangaDetail(id);
        setManga(data);
        setLoading(false);
      }
    };
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <p className="text-xl font-bold animate-pulse text-[#1F2544]">Loading Manga...</p>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center flex-col gap-4">
        <p className="text-xl font-bold text-red-500">Manga tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[#1F2544] text-white rounded">Kembali</button>
      </div>
    );
  }

  const coverUrl = manga.images?.webp?.large_image_url || manga.images?.jpg?.large_image_url || "https://placehold.co/400x600";

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col text-left">
      <Navbar />

      {/* Hero Header */}
      <div className="w-full h-64 md:h-80 relative overflow-hidden bg-[#1F2544]">
        <img 
          src={coverUrl} 
          alt="Background" 
          className="w-full h-full object-cover opacity-40 blur-sm scale-110"
        />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 text-white hover:text-gray-300 z-10 flex items-center gap-1 font-bold bg-black/20 px-3 py-2 rounded-full backdrop-blur-sm"
        >
          <ChevronLeft size={24} /> Kembali
        </button>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-32 relative z-10 flex flex-col items-center">
        {/* Cover */}
        <div className="w-48 h-72 rounded-xl overflow-hidden shadow-2xl mb-6 border-4 border-[#F4EFE6]">
          <img src={coverUrl} alt={manga.title} className="w-full h-full object-cover" />
        </div>

        {/* Title & Info */}
        <h1 className="text-3xl md:text-4xl font-bold font-heading text-[#1F2544] text-center mb-2">
          {manga.title}
        </h1>
        <p className="text-gray-600 mb-4 text-center font-medium">
          Author: {manga.authors?.map((a: any) => a.name).join(', ') || 'Unknown'}
        </p>

        <div className="flex items-center gap-6 mb-8 text-sm font-semibold text-gray-700">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-[#1F2544]" />
            {manga.members?.toLocaleString() || 0}
          </div>
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-[#1F2544]" />
            {manga.favorites?.toLocaleString() || 0}
          </div>
        </div>

        <p className="text-center text-gray-800 leading-relaxed mb-8 max-w-3xl">
          {manga.synopsis || "Tidak ada sinopsis tersedia."}
        </p>

        <Link 
          to={`/read/${id}/1`} 
          className="font-bold text-[#1F2544] underline hover:text-black mb-12"
        >
          Baca Episode Pertama
        </Link>

        {/* Episode List */}
        <div className="w-full flex flex-col gap-3 mb-16">
          {dummyEpisodes.map((ep) => (
            <Link 
              to={`/read/${id}/${ep.id}`} 
              key={ep.id}
              className="w-full bg-[#EAE3D2] hover:bg-[#DED7C6] transition-colors p-4 rounded-xl flex justify-between items-center"
            >
              <span className="font-medium text-[#1F2544]">{ep.title}</span>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Heart size={16} className="fill-gray-400" />
                {ep.likes}
              </div>
            </Link>
          ))}
          
          <div className="flex justify-center gap-2 mt-4 font-bold text-gray-500">
            <span>1</span> <span>2</span> <span>3</span> ... <ChevronRight />
          </div>
        </div>

        {/* Comments Section */}
        <div className="w-full flex flex-col gap-6">
          <h3 className="font-bold text-xl text-gray-400">104 Komen</h3>
          
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden shrink-0">
              <img src="https://placehold.co/100x100/1F2544/FFFFFF/png?text=Me" alt="My avatar" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea 
                placeholder="Tuliskan Komen Anda..." 
                className="w-full p-4 rounded-xl bg-[#EAE3D2] border-none focus:ring-2 focus:ring-[#1F2544] outline-none resize-none min-h-[100px]"
              ></textarea>
              <button className="self-end px-6 py-2 bg-[#EAE3D2] text-[#1F2544] font-bold rounded-lg hover:bg-gray-300">
                Kirim
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6 mt-4">
            {dummyComments.map(comment => (
              <div key={comment.id} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden shrink-0">
                  <img src={comment.avatar} alt={comment.name} />
                </div>
                <div className="flex-1 bg-[#EAE3D2] p-4 rounded-xl rounded-tl-none">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-[#1F2544]">{comment.name}</h4>
                    <span className="text-xs text-gray-500">{comment.time}</span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
