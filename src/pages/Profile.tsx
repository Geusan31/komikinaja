import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';

import { fetchManga } from '../services/api';
import { Edit2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout, setRole } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.role === 'author';
  const [activeTab, setActiveTab] = useState(isAuthor ? 'KOMIK' : 'FAVORIT');
  const [comics, setComics] = useState<any[]>([]);

  useEffect(() => {
    // Fetch some dummy "favorites" or "my comics" using Jikan API
    const loadComics = async () => {
      const data = await fetchManga(1, '', 8);
      setComics(data.data);
    };
    if (activeTab !== 'AKUN') {
      loadComics();
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangeRole = () => {
    setRole(isAuthor ? 'reader' : 'author');
    setActiveTab(!isAuthor ? 'KOMIK' : 'FAVORIT');
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col text-left">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start pb-8 border-b-2 border-gray-300">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1F2544]">
              <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full border border-gray-300 shadow-sm hover:bg-gray-100">
              <Edit2 size={16} className="text-[#1F2544]" />
            </button>
          </div>
          
          <div className="flex flex-col text-center md:text-left gap-2 pt-2">
            <h1 className="text-2xl font-bold font-heading text-[#1F2544]">{user?.name}</h1>
            <p className="text-gray-500 font-medium">@{user?.email.split('@')[0]}</p>
            <p className="text-sm text-gray-600 max-w-xl mt-2 leading-relaxed">
              Pencerita digital yang memadukan kreativitas dan data untuk menghasilkan konten yang relevan dan berdampak. Fokus utamanya adalah membuat audiens merasa didengar dan terhubung.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b-2 border-gray-300">
          <div className="flex gap-8">
            <button 
              onClick={() => setActiveTab(isAuthor ? 'KOMIK' : 'FAVORIT')}
              className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${
                activeTab !== 'AKUN' ? 'text-[#1F2544] border-b-4 border-[#1F2544]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {isAuthor ? 'Komik' : 'Favorit'}
            </button>
            <button 
              onClick={() => setActiveTab('AKUN')}
              className={`pb-4 font-bold text-sm tracking-widest uppercase transition-colors ${
                activeTab === 'AKUN' ? 'text-[#1F2544] border-b-4 border-[#1F2544]' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Akun
            </button>
          </div>
          
          {isAuthor && activeTab === 'KOMIK' && (
            <Link to="/add-comic" className="px-4 py-2 border-2 border-[#1F2544] text-[#1F2544] rounded-full text-sm font-bold hover:bg-[#1F2544] hover:text-white transition-colors mb-2">
              + Tambah Komik Baru
            </Link>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'AKUN' ? (
          <div className="flex flex-col gap-6">
            <AccountSection title="Login dengan">
              <div className="flex items-center gap-2 text-[#1F2544] font-bold">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                {user?.name}
              </div>
            </AccountSection>

            <AccountSection title="Nama Panggilan">
              <div className="flex justify-between items-center w-full text-sm font-bold text-[#1F2544]">
                <span>{user?.name}</span>
                <button className="px-4 py-1 border border-gray-400 rounded-full hover:bg-gray-200">Edit</button>
              </div>
            </AccountSection>

            <AccountSection title="Pengaturan">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#1F2544]">Email</span>
                    <span className="text-sm text-gray-600">{user?.email}</span>
                  </div>
                  <button className="px-4 py-1 border border-gray-400 rounded-full hover:bg-gray-200 text-sm font-bold">Ganti Email</button>
                </div>

                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <span className="font-medium text-gray-600">Notifikasi Komik Favorit</span>
                  <div className="w-12 h-6 bg-[#1F2544] rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <span className="font-medium text-gray-600">Komentar Terbaik</span>
                  <div className="w-12 h-6 bg-[#1F2544] rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-gray-300 pb-4">
                  <span className="font-medium text-gray-600">Ganti Role ({isAuthor ? 'Author -> Reader' : 'Reader -> Author'})</span>
                  <button onClick={handleChangeRole} className="px-4 py-1 border border-gray-400 rounded-full hover:bg-gray-200 text-sm font-bold">Ganti Role</button>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-medium text-gray-600">Pilih Bahasa</span>
                  <span className="font-bold text-[#1F2544] text-sm">Bahasa Indonesia &gt;</span>
                </div>
              </div>
            </AccountSection>

            <AccountSection title="Kode Promosi">
              <div className="flex flex-col gap-2 w-full md:w-1/2">
                <span className="text-sm text-gray-600">Silahkan klik tombol di kanan untuk mengisi Kode Promosi</span>
              </div>
              <div className="w-full md:w-1/2 flex justify-end">
                <button className="px-6 py-3 border border-gray-400 rounded-lg text-sm text-gray-500 w-full md:w-auto hover:bg-gray-200">
                  Isi Kode Promosi
                </button>
              </div>
            </AccountSection>

            <div className="flex justify-center mt-8">
              <button onClick={handleLogout} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                Log Out
              </button>
            </div>
          </div>
        ) : (
          /* Komik / Favorit Tab */
          <div className="flex flex-col gap-4">
            {isAuthor && (
              <div className="grid grid-cols-4 text-sm font-bold text-gray-500 pb-2 border-b border-gray-300 px-4">
                <span className="col-span-2 md:col-span-1">Title</span>
                <span className="hidden md:block">Status</span>
                <span className="hidden md:block">Followers</span>
                <span className="text-right md:text-left">Updated</span>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              {comics.map((comic) => (
                <Link to={`/comic/${comic.mal_id}`} key={comic.mal_id}>
                  {isAuthor ? (
                    <div className="grid grid-cols-4 items-center bg-[#EAE3D2] p-4 rounded-xl hover:bg-[#DED7C6] transition-colors">
                      <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                        <img src={comic.images?.webp?.small_image_url} alt={comic.title} className="w-12 h-16 object-cover rounded" />
                        <span className="font-bold text-[#1F2544] line-clamp-2">{comic.title}</span>
                      </div>
                      <span className="hidden md:block text-sm text-gray-600">{comic.status}</span>
                      <span className="hidden md:block text-sm text-gray-600">{comic.members?.toLocaleString() || 0}</span>
                      <span className="text-right md:text-left text-sm text-gray-600">4d</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 bg-[#EAE3D2] p-4 rounded-xl hover:bg-[#DED7C6] transition-colors">
                      <img src={comic.images?.webp?.small_image_url} alt={comic.title} className="w-16 h-24 object-cover rounded" />
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-lg text-[#1F2544] line-clamp-1">{comic.title}</span>
                        <span className="text-sm text-gray-600 line-clamp-2">{comic.synopsis || "No synopsis"}</span>
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

const AccountSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-[#EAE3D2] p-6 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
    <h3 className="font-bold text-xl text-[#1F2544] w-full md:w-1/4 shrink-0">{title}</h3>
    <div className="flex-1 flex flex-col md:flex-row items-center w-full">
      {children}
    </div>
  </div>
);
