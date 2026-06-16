import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ComicCard } from '../components/ComicCard';
import { heroBanner } from '../data/dummy';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchManga, fetchTopManga } from '../services/api';

export const Home: React.FC = () => {
  const [rekomendasi, setRekomendasi] = useState<any[]>([]);
  const [terakhirUpdate, setTerakhirUpdate] = useState<any[]>([]);
  const [shounen, setShounen] = useState<any[]>([]);
  const [fantasi, setFantasi] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const loadData = async () => {
      try {
        // Rekomendasi
        const rec = await fetchTopManga(6);
        setRekomendasi(rec);
        await sleep(1000); // Increased delay

        // Terakhir update
        const update = await fetchManga(1, '', 6);
        setTerakhirUpdate(update.data);
        await sleep(1000);

        // Shounen
        const shounenData = await fetchManga(1, 'shounen', 6);
        setShounen(shounenData.data);
        await sleep(1000);

        // Fantasi
        const fantasiData = await fetchManga(1, 'fantasy', 6);
        setFantasi(fantasiData.data);
      } catch (error) {
        console.error("Error loading home data:", error);
      }
    };
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-12">
        {/* Hero Section */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-[#1F2544] text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2 flex flex-col items-start text-left z-10">
            <h1 className="text-3xl md:text-4xl font-bold font-heading mb-4 leading-tight">
              {heroBanner.title}
            </h1>
            <p className="text-gray-300 mb-8 max-w-md line-clamp-3">
              {heroBanner.description}
            </p>
            <Link to={heroBanner.url} className="bg-[#EAE3D2] text-[#1F2544] px-6 py-3 rounded-full font-bold hover:bg-white transition-colors">
              Lihat Komik
            </Link>
          </div>
          
          {/* Hero Carousel Dummy */}
          <div className="md:w-1/2 flex items-center justify-center gap-4 z-10">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
              <ChevronLeft size={24} />
            </button>
            <div className="relative w-64 h-96 rounded-xl overflow-hidden shadow-2xl">
              <img src={heroBanner.cover} alt="Hero Cover" className="w-full h-full object-cover" />
            </div>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Decorative background blur */}
          <div 
            className="absolute top-0 right-0 w-full md:w-2/3 h-full opacity-30 blur-3xl scale-150 pointer-events-none"
            style={{ backgroundImage: `url(${heroBanner.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Searching..." 
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-transparent focus:border-[#1F2544] focus:ring-0 outline-none transition-colors"
          />
        </form>

        {/* Sections */}
        <Section title="Rekomendasi Untuk kamu!" mangas={rekomendasi} />
        <Section title="Terakhir Update" mangas={terakhirUpdate} />
        <Section title="Shounen Manga Top 10" mangas={shounen} />
        <Section title="Fantasi Manga Top 10" mangas={fantasi} />

        <div className="flex justify-center mt-4">
          <Link to="/category" className="text-[#1F2544] font-bold hover:underline flex items-center gap-1">
            View More
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Sub-component for sections
const Section: React.FC<{ title: string; mangas: any[] }> = ({ title, mangas }) => (
  <div className="flex flex-col gap-6 text-left min-h-[200px]">
    <h2 className="text-2xl font-bold font-heading text-[#1F2544]">{title}</h2>
    {mangas.length === 0 ? (
      <div className="animate-pulse flex gap-4 overflow-hidden">
        {[1,2,3,4,5,6].map(i => <div key={i} className="w-40 h-60 bg-gray-300 rounded-md shrink-0"></div>)}
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {mangas.map((manga) => (
          <Link to={`/comic/${manga.mal_id}`} key={manga.mal_id}>
            <ComicCard 
              title={manga.title}
              cover={manga.images?.webp?.image_url || manga.images?.jpg?.image_url || "https://placehold.co/400x600"}
              episode={manga.chapters ? `Chapters: ${manga.chapters}` : 'Ongoing'}
              likes={(manga.score || 0).toString()}
              views={(manga.members || 0).toLocaleString()}
              isNew={manga.status === "Publishing"}
            />
          </Link>
        ))}
      </div>
    )}
  </div>
);
