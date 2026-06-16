import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchMangaDetail } from '../services/api';
import { dummyPages, dummyComments } from '../data/dummy';
import { ChevronLeft, ChevronRight, Menu, Home } from 'lucide-react';

export const ReadingMode: React.FC = () => {
  const { id, episode } = useParams<{ id: string, episode: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<any>(null);

  useEffect(() => {
    const loadDetail = async () => {
      if (id) {
        const data = await fetchMangaDetail(id);
        setManga(data);
      }
    };
    loadDetail();
  }, [id]);

  const prevEp = parseInt(episode || '1') - 1;
  const nextEp = parseInt(episode || '1') + 1;

  return (
    <div className="min-h-screen bg-[#161A30] text-[#F4EFE6] flex flex-col">
      {/* Topbar */}
      <div className="sticky top-0 w-full bg-[#1F2544] p-4 flex items-center justify-between z-50">
        <button onClick={() => navigate(-1)} className="hover:text-white transition-colors">
          <ChevronLeft size={28} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-sm">{manga?.title || 'Loading...'}</span>
          <span className="text-xs text-gray-400">Ch. {episode}</span>
        </div>
        <button className="hover:text-white transition-colors">
          <Menu size={28} />
        </button>
      </div>

      {/* Pages Container */}
      <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col">
        {dummyPages.map((page, idx) => (
          <img 
            key={idx} 
            src={page} 
            alt={`Page ${idx + 1}`} 
            className="w-full h-auto object-contain bg-black"
          />
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="w-full bg-[#1F2544] p-4 flex items-center justify-between mt-8">
        <button 
          onClick={() => prevEp > 0 && navigate(`/read/${id}/${prevEp}`)}
          className={`flex items-center gap-2 font-bold ${prevEp > 0 ? 'hover:text-white' : 'opacity-50 cursor-not-allowed'}`}
        >
          <ChevronLeft size={20} /> Chapter {prevEp}
        </button>
        <Link to={`/comic/${id}`} className="hover:text-white">
          <Home size={24} />
        </Link>
        <button 
          onClick={() => navigate(`/read/${id}/${nextEp}`)}
          className="flex items-center gap-2 font-bold hover:text-white"
        >
          Chapter {nextEp} <ChevronRight size={20} />
        </button>
      </div>

      {/* Comments Section */}
      <div className="w-full max-w-3xl mx-auto p-4 flex flex-col gap-6 mt-8 mb-12">
        <h3 className="font-bold text-xl text-gray-300">104 Komen</h3>
        
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden shrink-0">
            <img src="https://placehold.co/100x100/1F2544/FFFFFF/png?text=Me" alt="My avatar" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea 
              placeholder="Tuliskan Komen Anda..." 
              className="w-full p-4 rounded-xl bg-[#EAE3D2] text-[#1F2544] border-none focus:ring-2 focus:ring-[#1F2544] outline-none resize-none min-h-[100px]"
            ></textarea>
            <button className="self-end px-6 py-2 bg-[#EAE3D2] text-[#1F2544] font-bold rounded-lg hover:bg-white">
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
              <div className="flex-1 bg-[#EAE3D2] text-[#1F2544] p-4 rounded-xl rounded-tl-none">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold">{comment.name}</h4>
                  <span className="text-xs text-gray-600">{comment.time}</span>
                </div>
                <p className="text-sm leading-relaxed font-medium">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
