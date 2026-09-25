import React, { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ComicCard, ComicSkeleton } from '../components/ComicCard';
import { heroBanners } from '../data/dummy';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchManga, fetchTopManga } from '../services/api';

export const Home: React.FC = () => {
  const [rekomendasi, setRekomendasi] = useState<any[]>([]);
  const [terakhirUpdate, setTerakhirUpdate] = useState<any[]>([]);
  const [shounen, setShounen] = useState<any[]>([]);
  const [fantasi, setFantasi] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState(heroBanners);
  const [loadingState, setLoadingState] = useState({ rec: true, update: true, shounen: true, fantasi: true });
  const navigate = useNavigate();

  // Auto-slide banner
  useEffect(() => {
    const timer = setInterval(() => {
      setBanners(prev => {
        setCurrentBanner((c) => (c === prev.length - 1 ? 0 : c + 1));
        return prev;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  useEffect(() => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const loadData = async () => {
      try {
        // Rekomendasi
        const rec = await fetchTopManga(6);
        setRekomendasi(rec);
        setLoadingState(s => ({ ...s, rec: false }));

        // Build dynamic banners from top manga with real cover images
        if (rec && rec.length >= 3) {
          const dynamicBanners = rec.slice(0, 3).map((manga: any, idx: number) => ({
            id: idx + 1,
            title: manga.title,
            description: manga.synopsis || "Komik populer yang wajib kamu baca di KomikinAja!",
            cover: manga.images?.webp?.large_image_url || manga.images?.webp?.image_url || manga.images?.jpg?.image_url || heroBanners[idx]?.cover,
            url: `/comic/${manga.mal_id}`
          }));
          setBanners(dynamicBanners);
          setCurrentBanner(0);
        }

        await sleep(1000);

        // Terakhir update
        const update = await fetchManga(1, '', 6);
        setTerakhirUpdate(update.data);
        setLoadingState(s => ({ ...s, update: false }));
        await sleep(1000);

        // Shounen
        const shounenData = await fetchManga(1, 'shounen', 6);
        setShounen(shounenData.data);
        setLoadingState(s => ({ ...s, shounen: false }));
        await sleep(1000);

        // Fantasi
        const fantasiData = await fetchManga(1, 'fantasy', 6);
        setFantasi(fantasiData.data);
        setLoadingState(s => ({ ...s, fantasi: false }));
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-12">
        {/* Hero Section */}
        <div className="relative w-full rounded-3xl overflow-hidden bg-primary text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 min-h-112.5">
          <div className="md:w-1/2 flex flex-col items-start text-left z-10 animate-fade-in" key={`text-${currentBanner}`}>
            <h1 className="text-3xl md:text-4xl font-bold font-heading mb-4 leading-tight drop-shadow-md">
              {banners[currentBanner]?.title}
            </h1>
            <p className="text-gray-300 mb-8 max-w-md line-clamp-3 drop-shadow">
              {banners[currentBanner]?.description}
            </p>
            <Link to={banners[currentBanner]?.url || '#'} className="bg-surface text-primary px-6 py-3 rounded-full font-bold hover:bg-white transition-colors">
              Lihat Komik
            </Link>
          </div>
          
          {/* Hero Carousel Display */}
          <div className="md:w-1/2 flex items-center justify-center gap-4 z-10">
            <button onClick={prevBanner} className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block bg-black/20 backdrop-blur-sm">
              <ChevronLeft size={24} />
            </button>
            <div className="relative w-64 h-96 rounded-xl overflow-hidden shadow-2xl" key={`img-${currentBanner}`}>
              <img src={banners[currentBanner]?.cover} alt="Hero Cover" className="w-full h-full object-cover animate-fade-in" />
            </div>
            <button onClick={nextBanner} className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block bg-black/20 backdrop-blur-sm">
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentBanner(idx)}
                className={`w-3 h-3 rounded-full transition-all ${currentBanner === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`}
              />
            ))}
          </div>

          {/* Decorative background blur */}
          <div 
            className="absolute top-0 right-0 w-full md:w-2/3 h-full opacity-40 blur-3xl scale-150 pointer-events-none transition-all duration-1000 ease-in-out"
            style={{ backgroundImage: `url(${banners[currentBanner]?.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
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
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 bg-transparent focus:border-primary focus:ring-0 outline-none transition-colors"
          />
        </form>

        {/* Sections */}
        <Section title="Rekomendasi Untuk kamu!" mangas={rekomendasi} loading={loadingState.rec} />
        <Section title="Terakhir Update" mangas={terakhirUpdate} loading={loadingState.update} />
        <Section title="Shounen Manga Top 10" mangas={shounen} loading={loadingState.shounen} />
        <Section title="Fantasi Manga Top 10" mangas={fantasi} loading={loadingState.fantasi} />

        <div className="flex justify-center mt-4">
          <Link to="/category" className="text-primary font-bold hover:underline flex items-center gap-1">
            View More
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Sub-component for sections
const Section: React.FC<{ title: string; mangas: any[]; loading?: boolean }> = ({ title, mangas, loading = false }) => {
  return (
    <div className="flex flex-col gap-6 text-left min-h-50">
      <h2 className="text-2xl font-bold font-heading text-primary">{title}</h2>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => <ComicSkeleton key={i} />)}
        </div>
      ) : mangas.length === 0 ? (
        <p className="text-gray-500 text-sm">Tidak ada data tersedia.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mangas.map((manga) => (
            <Link to={`/comic/${manga.mal_id}`} key={manga.mal_id}>
              <ComicCard 
                title={manga.title}
                cover={manga.images?.webp?.image_url || manga.images?.jpg?.image_url || ''}
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
};
